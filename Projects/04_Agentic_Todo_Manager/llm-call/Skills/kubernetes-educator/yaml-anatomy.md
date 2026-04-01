# Kubernetes YAML Anatomy — Field-by-Field Reference

## Table of Contents
1. [Universal YAML Structure](#universal)
2. [apiVersion Reference](#apiversion)
3. [Metadata Fields](#metadata)
4. [Label & Selector Mechanics](#labels)
5. [Spec Deep Dive per Object Type](#specs)
6. [Resource Requests & Limits](#resources)
7. [Common Patterns & Anti-Patterns](#patterns)

---

## 1. Universal YAML Structure {#universal}

```yaml
#═══════════════════════════════════════════════════════════════
#  KUBERNETES YAML SKELETON — applies to ALL objects
#═══════════════════════════════════════════════════════════════

apiVersion: <group>/<version>   # 🔴 REQUIRED
kind: <ObjectType>              # 🔴 REQUIRED
metadata:                       # 🔴 REQUIRED
  name: <string>                # 🔴 REQUIRED — unique within namespace
  namespace: <string>           # 🟡 RECOMMENDED — omit = "default"
  labels:                       # 🟡 RECOMMENDED — used for selection
    <key>: <value>
  annotations:                  # 🟢 OPTIONAL — metadata for tools
    <key>: <value>
spec:                           # 🔴 REQUIRED — desired state
  <object-specific fields>
status:                         # ❌ NEVER SET — managed by Kubernetes
  <runtime state>
```

**Rule:** When you `kubectl apply`, Kubernetes:
1. Takes your `spec`
2. Compares with current `status`
3. Takes actions to make `status` match `spec`

---

## 2. apiVersion Reference {#apiversion}

```
Object                    │ apiVersion
──────────────────────────┼──────────────────────────────────
Pod                       │ v1
Service                   │ v1
ConfigMap                 │ v1
Secret                    │ v1
PersistentVolume          │ v1
PersistentVolumeClaim     │ v1
Namespace                 │ v1
ServiceAccount            │ v1
LimitRange                │ v1
ResourceQuota             │ v1
──────────────────────────┼──────────────────────────────────
Deployment                │ apps/v1
ReplicaSet                │ apps/v1
DaemonSet                 │ apps/v1
StatefulSet               │ apps/v1
──────────────────────────┼──────────────────────────────────
Job                       │ batch/v1
CronJob                   │ batch/v1
──────────────────────────┼──────────────────────────────────
Ingress                   │ networking.k8s.io/v1
NetworkPolicy             │ networking.k8s.io/v1
──────────────────────────┼──────────────────────────────────
HorizontalPodAutoscaler   │ autoscaling/v2
──────────────────────────┼──────────────────────────────────
Role                      │ rbac.authorization.k8s.io/v1
ClusterRole               │ rbac.authorization.k8s.io/v1
RoleBinding               │ rbac.authorization.k8s.io/v1
ClusterRoleBinding        │ rbac.authorization.k8s.io/v1
──────────────────────────┼──────────────────────────────────
StorageClass              │ storage.k8s.io/v1
──────────────────────────┼──────────────────────────────────
CustomResourceDefinition  │ apiextensions.k8s.io/v1
```

**How to find apiVersion for any resource:**
```bash
kubectl api-resources                    # lists all resources with versions
kubectl explain <resource>               # shows resource info
kubectl explain deployment.spec          # drill into spec fields
```

---

## 3. Metadata Fields {#metadata}

```yaml
metadata:
  #─────────────────────────────────────────────────
  # 🔴 REQUIRED FIELDS
  #─────────────────────────────────────────────────
  name: my-app-deployment          # Unique within namespace
                                   # DNS-compatible: lowercase, hyphens only
                                   # Max 253 chars (63 for most resources)

  #─────────────────────────────────────────────────
  # 🟡 STRONGLY RECOMMENDED
  #─────────────────────────────────────────────────
  namespace: production            # Logical isolation unit
                                   # Default: "default" namespace
                                   # Cluster-scoped resources (Node, PV) ignore this

  labels:                          # Key-value pairs for organizing/selecting
    app: my-app                    # ← Standard: identify app name
    version: "2.1.0"              # ← Standard: app version
    component: backend             # ← Standard: what part of app
    environment: production        # ← Standard: which env
    tier: api                      # ← Optional: app tier
    managed-by: helm               # ← Helm adds this automatically

  #─────────────────────────────────────────────────
  # 🟢 OPTIONAL FIELDS
  #─────────────────────────────────────────────────
  annotations:
    # Human-readable metadata (not for selection)
    description: "Main API deployment for user service"
    contact: "team-backend@company.com"
    
    # Tool-specific annotations (very common)
    kubectl.kubernetes.io/last-applied-configuration: "..."
    deployment.kubernetes.io/revision: "3"
    
    # Ingress annotations (nginx-specific example)
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    
    # Prometheus monitoring
    prometheus.io/scrape: "true"
    prometheus.io/port: "9090"

  # These are SET BY KUBERNETES — never put in your YAML:
  # resourceVersion, uid, creationTimestamp, generation, selfLink
```

---

## 4. Label & Selector Mechanics {#labels}

```
Labels are KEY-VALUE metadata attached to objects.
Selectors filter objects by their labels.

This relationship is FUNDAMENTAL to how Kubernetes works:

  Deployment.spec.selector ──────► matches ──────► Pod.metadata.labels
  Service.spec.selector    ──────► matches ──────► Pod.metadata.labels
  ReplicaSet.spec.selector ──────► matches ──────► Pod.metadata.labels

⚠️  CRITICAL RULE: selector labels MUST match template labels!
    If they don't match → Deployment won't manage its own pods!
```

```yaml
# CORRECT — selector matches template labels
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  selector:
    matchLabels:
      app: my-app       # ← must match ↓
  template:
    metadata:
      labels:
        app: my-app     # ← must match ↑

# WRONG — selector doesn't match template
spec:
  selector:
    matchLabels:
      app: my-app       # ← looking for this
  template:
    metadata:
      labels:
        name: my-app    # ← different key! Deployment won't work.
```

**Label selector types:**

```yaml
# 1. Equality-based (most common)
selector:
  matchLabels:
    app: nginx
    env: production

# 2. Set-based (more powerful)
selector:
  matchExpressions:
    - key: app
      operator: In
      values: [nginx, apache]     # app is nginx OR apache
    - key: env
      operator: NotIn
      values: [development]       # env is NOT development
    - key: tier
      operator: Exists            # key 'tier' exists (any value)
    - key: legacy
      operator: DoesNotExist      # key 'legacy' does not exist
```

---

## 5. Spec Deep Dive per Object Type {#specs}

### Pod Spec Anatomy (most detailed — other objects embed this)

```yaml
spec:
  #─────────────────────────────────────────
  # CONTAINERS (🔴 Required — at least one)
  #─────────────────────────────────────────
  containers:
    - name: my-container           # 🔴 Required — unique per pod
      image: nginx:1.25            # 🔴 Required — image:tag
      
      # Port declaration (informational only — doesn't open/close ports)
      ports:
        - containerPort: 80        # 🟢 Optional but recommended
          name: http               # 🟢 Named port (referenced by Services)
          protocol: TCP            # 🟢 TCP (default), UDP, SCTP

      # Environment variables
      env:
        - name: DATABASE_URL       # 🟢 Direct value
          value: "postgres://..."
        - name: DB_PASSWORD        # 🟢 From Secret
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        - name: APP_NAME           # 🟢 From ConfigMap
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: app_name
      
      # Load entire ConfigMap/Secret as env vars
      envFrom:
        - configMapRef:
            name: app-config       # 🟢 All keys become env vars
        - secretRef:
            name: app-secrets

      # Resource requests and limits
      resources:
        requests:                  # 🟡 What the pod NEEDS (for scheduling)
          cpu: "100m"              #    100 millicores = 0.1 CPU core
          memory: "128Mi"
        limits:                    # 🟡 Maximum pod can USE
          cpu: "500m"
          memory: "512Mi"

      # Volume mounts
      volumeMounts:
        - name: config-vol         # Must match volume name below
          mountPath: /etc/config   # Where to mount inside container
          readOnly: true           # 🟢 Optional — defaults false
          subPath: app.conf        # 🟢 Optional — mount single file

      # Health probes
      livenessProbe:               # 🟡 Is container alive? Restart if fails.
        httpGet:
          path: /healthz
          port: 8080
        initialDelaySeconds: 10
        periodSeconds: 10
        failureThreshold: 3

      readinessProbe:              # 🟡 Is container ready for traffic?
        httpGet:
          path: /ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5

      startupProbe:                # 🟢 Slow-starting apps — overrides liveness
        httpGet:
          path: /healthz
          port: 8080
        failureThreshold: 30
        periodSeconds: 10

      # Security context (per container)
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        readOnlyRootFilesystem: true
        allowPrivilegeEscalation: false
        capabilities:
          drop: ["ALL"]

      # Lifecycle hooks
      lifecycle:
        postStart:
          exec:
            command: ["/bin/sh", "-c", "echo started > /tmp/started"]
        preStop:
          exec:
            command: ["/bin/sh", "-c", "sleep 10"]

      # Container working directory
      workingDir: /app
      
      # Override container entrypoint
      command: ["/bin/sh"]        # 🟢 Overrides ENTRYPOINT in Dockerfile
      args: ["-c", "echo hello"] # 🟢 Overrides CMD in Dockerfile

      # Image pull policy
      imagePullPolicy: IfNotPresent   # Always | IfNotPresent | Never

  #─────────────────────────────────────────
  # INIT CONTAINERS (run before main containers)
  #─────────────────────────────────────────
  initContainers:
    - name: init-db-ready
      image: busybox
      command: ['sh', '-c', 'until nc -z db-svc 5432; do sleep 1; done']

  #─────────────────────────────────────────
  # VOLUMES (mounted by containers above)
  #─────────────────────────────────────────
  volumes:
    - name: config-vol
      configMap:
        name: app-config
    - name: secret-vol
      secret:
        secretName: app-secrets
    - name: data-vol
      persistentVolumeClaim:
        claimName: data-pvc
    - name: temp-vol
      emptyDir: {}              # Ephemeral, shared between containers in pod
    - name: host-vol
      hostPath:
        path: /var/log
        type: Directory

  #─────────────────────────────────────────
  # POD-LEVEL SETTINGS
  #─────────────────────────────────────────
  restartPolicy: Always         # Always (default) | OnFailure | Never
  
  serviceAccountName: my-sa    # 🟢 Pod identity for API access
  
  # Pod-level security context
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000               # Volume ownership group
    
  # Scheduling constraints
  nodeSelector:                 # 🟢 Only schedule on nodes with these labels
    disktype: ssd
    
  affinity:                     # 🟢 Advanced scheduling rules
    nodeAffinity: ...
    podAffinity: ...
    podAntiAffinity: ...
    
  tolerations:                  # 🟢 Allow scheduling on tainted nodes
    - key: "gpu"
      operator: "Exists"
      effect: "NoSchedule"
      
  topologySpreadConstraints:    # 🟢 Spread pods across zones/nodes
    - maxSkew: 1
      topologyKey: zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app: my-app

  # DNS settings
  dnsPolicy: ClusterFirst       # Default — use cluster DNS
  
  # Image pull secrets (for private registries)
  imagePullSecrets:
    - name: registry-secret

  # Termination grace period
  terminationGracePeriodSeconds: 30   # Default: 30s
  
  # Hostname inside pod
  hostname: my-pod
  subdomain: my-service
```

### Deployment Spec Anatomy

```yaml
spec:
  replicas: 3                   # 🔴 Number of pod copies (default: 1)
  
  selector:                     # 🔴 How to find pods belonging to this Deployment
    matchLabels:
      app: my-app

  template:                     # 🔴 Pod template (identical to Pod spec)
    metadata:
      labels:
        app: my-app             # Must match selector above
    spec:
      containers: [...]

  strategy:                     # 🟡 How to update pods
    type: RollingUpdate         # RollingUpdate (default) | Recreate
    rollingUpdate:
      maxSurge: 25%             # Extra pods during update (default 25%)
      maxUnavailable: 25%       # Unavailable pods during update (default 25%)
  
  minReadySeconds: 0            # 🟢 Wait N seconds before marking pod Ready
  revisionHistoryLimit: 10      # 🟢 How many old ReplicaSets to keep
  progressDeadlineSeconds: 600  # 🟢 Fail if rollout takes > N seconds
  paused: false                 # 🟢 Pause/resume rollout
```

### Service Spec Anatomy

```yaml
spec:
  selector:                     # 🔴 Which pods to route traffic to
    app: my-app

  ports:                        # 🔴 Port mapping
    - port: 80                  # 🔴 Service port (what clients connect to)
      targetPort: 8080          # 🟡 Pod port (what container listens on)
      protocol: TCP             # 🟢 TCP (default), UDP, SCTP
      name: http                # 🟢 Named port

  type: ClusterIP               # 🟡 ClusterIP | NodePort | LoadBalancer | ExternalName
  
  # For NodePort type:
  nodePort: 30080               # 🟢 30000-32767 range (auto-assigned if omitted)
  
  # For LoadBalancer type:
  loadBalancerIP: "1.2.3.4"    # 🟢 Request specific IP
  
  sessionAffinity: None         # 🟢 None | ClientIP (sticky sessions)
  clusterIP: None               # 🟢 Set to None for Headless Service
```

---

## 6. Resource Requests & Limits {#resources}

```yaml
resources:
  requests:           # Minimum guaranteed resources (used for scheduling)
    cpu: "100m"       # 100 millicores = 0.1 of one CPU core
    memory: "128Mi"   # 128 Mebibytes (Mi not MB!)
  limits:             # Maximum allowed (pod killed/throttled if exceeded)
    cpu: "500m"       # 0.5 CPU cores
    memory: "512Mi"

# CPU units:
#   1000m = 1 CPU core
#   500m  = 0.5 CPU core
#   100m  = 0.1 CPU core (minimum meaningful unit)
#   1     = 1 CPU (same as 1000m)
#   0.25  = 250m

# Memory units:
#   Ki = Kibibyte (1024 bytes)     e.g., 128Ki
#   Mi = Mebibyte (1024 Ki)        e.g., 256Mi
#   Gi = Gibibyte (1024 Mi)        e.g., 2Gi
#   K  = Kilobyte (1000 bytes)     less common
#   M  = Megabyte (1000 K)         less common

# CPU behavior:
#   Over limit → THROTTLED (slowed down, NOT killed)
#
# Memory behavior:
#   Over limit → KILLED (OOMKilled — Out of Memory)
#   Restart policy determines what happens next
```

---

## 7. Common Patterns & Anti-Patterns {#patterns}

### ✅ Good Patterns

```yaml
# Pattern 1: Always set resource limits
resources:
  requests: { cpu: "100m", memory: "128Mi" }
  limits:   { cpu: "500m", memory: "512Mi" }

# Pattern 2: Use named ports
ports:
  - containerPort: 8080
    name: http-api      # Reference by name elsewhere

# Pattern 3: Use labels consistently
labels:
  app: myapp
  version: "1.0.0"
  component: backend

# Pattern 4: Always have health probes
livenessProbe:
  httpGet: { path: /health, port: 8080 }
  initialDelaySeconds: 10
  periodSeconds: 10

# Pattern 5: Set terminationGracePeriodSeconds
terminationGracePeriodSeconds: 60   # Give app time to drain connections
```

### ❌ Anti-Patterns

```yaml
# ❌ Don't use :latest tag — not reproducible
image: nginx:latest

# ✅ Use specific version
image: nginx:1.25.3

# ❌ Don't skip resource limits — one pod can starve the node
# (no resources section at all)

# ❌ Don't hardcode secrets as env vars
env:
  - name: DB_PASSWORD
    value: "mysecretpassword"    # ← visible in YAML, kubectl output!

# ✅ Use Secret references
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-secret
        key: password

# ❌ Don't run as root
securityContext:
  runAsUser: 0   # ← root!

# ✅ Run as non-root
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
```
