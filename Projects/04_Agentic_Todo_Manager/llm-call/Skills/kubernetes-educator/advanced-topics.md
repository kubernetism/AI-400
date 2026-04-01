# Kubernetes Advanced Topics Reference

## Table of Contents
1. [Init Containers](#init-containers)
2. [Sidecar Containers](#sidecars)
3. [Health Probes Deep Dive](#probes)
4. [Security Context & Pod Security Standards](#security)
5. [Helm Charts](#helm)
6. [API Deprecation Handling](#api-deprecation)
7. [Debugging & Troubleshooting Guide](#debugging)
8. [kubectl Tips & Tricks](#kubectl-tips)

---

## 1. Init Containers {#init-containers}

**Purpose:** Containers that run and complete BEFORE the main containers start. Used to set up prerequisites.

```
Pod lifecycle:
  init-container-1 → runs to completion
  init-container-2 → runs to completion
  main-container   → starts ONLY after all init containers succeed
```

**Use cases:**
- Wait for a database to be ready
- Clone a git repo before the app starts
- Download configuration files
- Set up file system permissions

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  initContainers:
    - name: wait-for-db
      image: busybox:1.36
      command: ['sh', '-c', 
        'until nc -z db-service 5432; do echo "waiting for db"; sleep 2; done']
    
    - name: clone-config
      image: alpine/git
      command: ['git', 'clone', 'https://github.com/org/config.git', '/config']
      volumeMounts:
        - name: config-vol
          mountPath: /config
  
  containers:
    - name: app
      image: myapp:v1
      volumeMounts:
        - name: config-vol
          mountPath: /app/config
  
  volumes:
    - name: config-vol
      emptyDir: {}
```

**Key differences from regular containers:**
- Run sequentially (not in parallel)
- Must complete successfully before app starts
- Can use different images from main app
- If init container fails → pod stays in Init state, retries

---

## 2. Sidecar Containers {#sidecars}

**Purpose:** Helper containers that run alongside the main container in the same pod. Share network and volumes.

```
Pod
├── Main Container (app)       ← Business logic
├── Sidecar: Log Forwarder     ← Ships logs to central system
├── Sidecar: Envoy Proxy       ← Service mesh (Istio)
└── Sidecar: Config Watcher    ← Hot-reloads config files
```

**Common sidecar patterns:**

```yaml
# Pattern 1: Log forwarding sidecar
spec:
  containers:
    - name: app
      image: myapp:v1
      volumeMounts:
        - name: logs
          mountPath: /var/log/app
    
    - name: log-forwarder           # Sidecar reads logs written by app
      image: fluent/fluentd:v1.16
      volumeMounts:
        - name: logs
          mountPath: /var/log/app
  
  volumes:
    - name: logs
      emptyDir: {}

# Pattern 2: Metrics exporter sidecar
spec:
  containers:
    - name: app
      image: myapp:v1
      ports:
        - containerPort: 8080     # App port
    
    - name: metrics-exporter       # Scrapes app and exposes Prometheus metrics
      image: prom/jmx-exporter:latest
      ports:
        - containerPort: 9090     # Metrics port
```

**Kubernetes 1.29+ native sidecar containers:**
```yaml
initContainers:
  - name: log-sidecar
    image: fluent/fluentd
    restartPolicy: Always      # ← This makes it a "sidecar" init container
                               # Runs continuously alongside main containers
```

---

## 3. Health Probes Deep Dive {#probes}

```
Three probe types:
─────────────────────────────────────────────────────────────
livenessProbe   → Is the container alive? 
                  Fail → kubelet RESTARTS the container

readinessProbe  → Is the container ready to receive traffic?
                  Fail → Service REMOVES pod from endpoints
                  (pod keeps running, just gets no traffic)

startupProbe    → Is the app done starting up?
                  While failing → liveness probe is DISABLED
                  For slow-starting apps (JVM, large ML models)
```

```yaml
containers:
  - name: app
    image: myapp:v1
    
    # ─── Liveness Probe ──────────────────────────────────────
    livenessProbe:
      httpGet:                    # Option 1: HTTP check
        path: /healthz
        port: 8080
        httpHeaders:
          - name: X-Health-Check
            value: "true"
      # exec:                     # Option 2: Run command
      #   command: ["cat", "/tmp/healthy"]
      # tcpSocket:                # Option 3: TCP port check
      #   port: 8080
      # grpc:                     # Option 4: gRPC health check
      #   port: 50051
      initialDelaySeconds: 10     # Wait 10s before first check
      periodSeconds: 10           # Check every 10s
      failureThreshold: 3         # Restart after 3 failures
      successThreshold: 1         # 1 success = healthy (liveness only)
      timeoutSeconds: 5           # Timeout per check
    
    # ─── Readiness Probe ─────────────────────────────────────
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 3
      successThreshold: 1        # Readiness: can be > 1 (stabilization)
    
    # ─── Startup Probe ───────────────────────────────────────
    startupProbe:
      httpGet:
        path: /healthz
        port: 8080
      failureThreshold: 30       # Allow 30 * 10s = 5 minutes to start
      periodSeconds: 10
```

**When to use which:**
```
Use startupProbe  → App takes > 30 seconds to start (JVM, models)
Use livenessProbe → App can deadlock or become unresponsive
Use readinessProbe → App has external dependencies (DB, cache)
                     OR during rolling updates (don't take traffic until ready)
```

---

## 4. Security Context & Pod Security Standards {#security}

### Security Context

```yaml
# Pod-level securityContext (applies to all containers)
spec:
  securityContext:
    runAsNonRoot: true        # Container must run as non-root user
    runAsUser: 1000           # Specific user ID
    runAsGroup: 3000          # Specific group ID
    fsGroup: 2000             # Volume ownership group
    seccompProfile:
      type: RuntimeDefault    # Apply default seccomp profile
    sysctls:                  # Kernel parameters
      - name: net.core.somaxconn
        value: "1024"

  containers:
    - name: app
      # Container-level (overrides pod-level)
      securityContext:
        allowPrivilegeEscalation: false  # 🔴 Always set false
        readOnlyRootFilesystem: true     # 🟡 Recommended
        capabilities:
          drop: ["ALL"]                  # 🟡 Drop all Linux capabilities
          add: ["NET_BIND_SERVICE"]      # 🟢 Add only what's needed
        runAsUser: 1000                  # Override pod-level
```

### Pod Security Standards (PSS)

Three built-in security profiles applied at namespace level:

```bash
# Enforce "restricted" profile (most secure) on namespace
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/audit=restricted
```

```
Profile         | What it requires
────────────────┼───────────────────────────────────────────────
privileged      | No restrictions (for system workloads)
baseline        | Prevents known privilege escalations
restricted      | Follows pod hardening best practices:
                |  - Must run as non-root
                |  - Must drop all capabilities
                |  - No privilege escalation
                |  - Read-only root filesystem recommended
                |  - Must have seccomp profile
```

---

## 5. Helm Charts {#helm}

**Purpose:** Package manager for Kubernetes. Bundle multiple K8s YAML files into one reusable, versioned, configurable package.

```
Helm Chart Structure:
my-chart/
├── Chart.yaml          # Chart metadata (name, version, description)
├── values.yaml         # Default configuration values
├── templates/          # K8s YAML templates (with Go templating)
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── ingress.yaml
│   └── _helpers.tpl    # Reusable template fragments
└── charts/             # Sub-charts (dependencies)
```

```bash
# ─── Essential Helm Commands ──────────────────────────────────
# Install a chart
helm install my-release bitnami/nginx

# Install with custom values
helm install my-release bitnami/nginx \
  --set replicaCount=3 \
  --set service.type=LoadBalancer

# Install with values file
helm install my-release bitnami/nginx -f my-values.yaml

# See what would be deployed (dry run)
helm install my-release bitnami/nginx --dry-run --debug

# Upgrade a release
helm upgrade my-release bitnami/nginx --set replicaCount=5

# Rollback
helm rollback my-release 1

# Uninstall
helm uninstall my-release

# List releases
helm list

# Search charts
helm search repo nginx
helm search hub nginx

# Add chart repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Show chart values
helm show values bitnami/nginx

# Check release history
helm history my-release
```

**values.yaml example:**
```yaml
replicaCount: 2
image:
  repository: nginx
  tag: "1.25"
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

---

## 6. API Deprecation Handling {#api-deprecation}

Kubernetes releases new versions ~4x per year. APIs get deprecated and removed.

```bash
# Check current API versions
kubectl api-versions
kubectl api-resources

# Check if a resource uses a deprecated API
kubectl get deployment my-app -o yaml | grep apiVersion

# Convert old API manifests (deprecated tool — use kubent instead)
# kubectl convert -f old-deployment.yaml --output-version apps/v1

# Find deprecated APIs in your cluster
kubectl get events --field-selector reason=APIDeprecated

# Check what APIs are deprecated before upgrading
# Tool: Pluto (https://github.com/FairwindsOps/pluto)
pluto detect-files -d ./manifests
pluto detect-helm -owide
```

**Key API migrations:**
```
apps/v1beta1 Deployment    → apps/v1          (since K8s 1.16)
extensions/v1beta1 Ingress → networking.k8s.io/v1  (since K8s 1.22)
batch/v1beta1 CronJob      → batch/v1         (since K8s 1.25)
autoscaling/v2beta2 HPA    → autoscaling/v2   (since K8s 1.26)
```

---

## 7. Debugging & Troubleshooting Guide {#debugging}

```bash
# ─── Pod not starting? ───────────────────────────────────────
kubectl get pods -n <namespace>                    # Check status
kubectl describe pod <pod-name>                    # Events section!
kubectl logs <pod-name>                            # App logs
kubectl logs <pod-name> --previous                 # Logs from crashed container
kubectl logs <pod-name> -c <container-name>        # Multi-container pod

# ─── Pod status meanings ─────────────────────────────────────
# Pending     → Not scheduled yet (resource limits? node selector?)
# Init:0/1    → Init container running/waiting
# CrashLoopBackOff → Crashing repeatedly (check logs!)
# ImagePullBackOff → Can't pull image (wrong name? auth?)
# OOMKilled   → Out of memory (increase memory limits)
# Terminating → Stuck deleting (try: kubectl delete pod --force)

# ─── Network debugging ───────────────────────────────────────
kubectl exec -it debug-pod -- curl http://my-service
kubectl exec -it debug-pod -- nslookup my-service
kubectl exec -it debug-pod -- wget -qO- http://my-service:80/health

# Deploy a debug pod
kubectl run debug --image=busybox --rm -it --restart=Never -- /bin/sh
kubectl run debug --image=nicolaka/netshoot --rm -it --restart=Never -- bash

# ─── Resource usage ──────────────────────────────────────────
kubectl top pods                    # CPU/memory per pod (needs metrics-server)
kubectl top nodes                   # CPU/memory per node

# ─── Events ──────────────────────────────────────────────────
kubectl get events --sort-by=.lastTimestamp
kubectl get events -n <namespace> --field-selector type=Warning

# ─── Cluster info ────────────────────────────────────────────
kubectl cluster-info
kubectl get nodes -o wide
kubectl describe node <node-name>
```

---

## 8. kubectl Tips & Tricks {#kubectl-tips}

```bash
# ─── Context & namespace management ─────────────────────────
kubectl config get-contexts
kubectl config use-context my-cluster
kubectl config set-context --current --namespace=production

# ─── Output formats ──────────────────────────────────────────
kubectl get pods -o wide                    # Extra columns
kubectl get pods -o yaml                    # Full YAML
kubectl get pods -o json                    # JSON
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get pods --no-headers               # Clean for scripting

# ─── Label filtering ─────────────────────────────────────────
kubectl get pods -l app=my-app
kubectl get pods -l 'environment in (production,staging)'
kubectl get pods -l 'app=my-app,version=v2'

# ─── Watch mode ──────────────────────────────────────────────
kubectl get pods -w                         # Watch for changes
kubectl get pods --watch

# ─── Apply multiple files ────────────────────────────────────
kubectl apply -f ./manifests/              # All files in directory
kubectl apply -R -f ./manifests/           # Recursive

# ─── Diff before applying ────────────────────────────────────
kubectl diff -f deployment.yaml            # See what would change

# ─── Port forwarding ─────────────────────────────────────────
kubectl port-forward pod/my-pod 8080:80
kubectl port-forward svc/my-service 8080:80
kubectl port-forward deployment/my-app 8080:80

# ─── Useful aliases ──────────────────────────────────────────
alias k=kubectl
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgd='kubectl get deployments'
alias kdp='kubectl describe pod'
alias kl='kubectl logs'
complete -F __start_kubectl k    # Tab completion for alias

# ─── Generate YAML stubs ─────────────────────────────────────
kubectl run pod --image=nginx --dry-run=client -o yaml
kubectl create deployment app --image=nginx --dry-run=client -o yaml
kubectl create service clusterip svc --tcp=80:80 --dry-run=client -o yaml
kubectl create configmap cm --from-literal=key=val --dry-run=client -o yaml
kubectl create secret generic sec --from-literal=pass=secret --dry-run=client -o yaml
```
