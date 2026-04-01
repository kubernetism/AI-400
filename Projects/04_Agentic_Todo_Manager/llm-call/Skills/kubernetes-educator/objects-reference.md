# Kubernetes Objects Reference — Complete Definitions

## Table of Contents (Basic → Advanced)
1. [Namespace](#namespace)
2. [Pod](#pod)
3. [ReplicaSet](#replicaset)
4. [Deployment](#deployment)
5. [Service](#service)
6. [ConfigMap](#configmap)
7. [Secret](#secret)
8. [PersistentVolume & PVC](#storage)
9. [Job & CronJob](#jobs)
10. [DaemonSet](#daemonset)
11. [StatefulSet](#statefulset)
12. [Ingress](#ingress)
13. [NetworkPolicy](#networkpolicy)
14. [ServiceAccount & RBAC](#rbac)
15. [HorizontalPodAutoscaler](#hpa)
16. [ResourceQuota & LimitRange](#quotas)
17. [CustomResourceDefinition](#crd)

---

## 1. Namespace {#namespace}

**Purpose:** Virtual cluster within a cluster. Provides isolation of resources between teams, projects, or environments.

```
Cluster
├── namespace: default       ← Created automatically
├── namespace: kube-system   ← Kubernetes internals (don't touch!)
├── namespace: kube-public   ← Publicly readable
├── namespace: production    ← Your app namespace
└── namespace: staging       ← Another environment
```

```yaml
# ─── DECLARATIVE ─────────────────────────────────────────────
apiVersion: v1
kind: Namespace
metadata:
  name: production           # 🔴 Required
  labels:
    environment: production   # 🟢 Optional but useful
    team: backend
```

```bash
# ─── IMPERATIVE ──────────────────────────────────────────────
kubectl create namespace production
kubectl get namespaces
kubectl delete namespace production

# Work within a namespace
kubectl get pods -n production
kubectl apply -f app.yaml -n production   # override manifest namespace
```

---

## 2. Pod {#pod}

**Purpose:** Smallest deployable unit. Wraps one or more tightly-coupled containers that share network and storage.

```
Pod
├── Shared network namespace (same IP address)
│   └── Containers communicate via localhost
├── Shared storage volumes
├── Container 1 (main app)
├── Container 2 (sidecar)  ← Optional
└── Container 3 (sidecar)  ← Optional
```

```yaml
# ─── DECLARATIVE ─────────────────────────────────────────────
apiVersion: v1              # 🔴 Required
kind: Pod                   # 🔴 Required
metadata:
  name: my-pod              # 🔴 Required
  namespace: default        # 🟡 Recommended
  labels:
    app: my-app             # 🟡 Recommended (needed for Service selectors)
spec:
  containers:
    - name: app             # 🔴 Required
      image: nginx:1.25     # 🔴 Required
      ports:
        - containerPort: 80   # 🟢 Optional (informational)
      resources:
        requests:
          cpu: "100m"
          memory: "128Mi"
        limits:
          cpu: "500m"
          memory: "256Mi"
      env:
        - name: ENV_VAR
          value: "hello"
  restartPolicy: Always     # 🟢 Always|OnFailure|Never (default: Always)
```

```bash
# ─── IMPERATIVE ──────────────────────────────────────────────
kubectl run my-pod --image=nginx:1.25 --port=80
kubectl run my-pod --image=nginx:1.25 --env="ENV_VAR=hello"

# Debug commands
kubectl get pods
kubectl get pod my-pod -o wide          # Show node and IP
kubectl describe pod my-pod             # Events + details
kubectl logs my-pod                     # Container logs
kubectl logs my-pod -c container-name   # Multi-container pod logs
kubectl exec -it my-pod -- /bin/bash    # Shell into pod
kubectl exec -it my-pod -- env          # Check env vars

# Generate YAML from imperative command
kubectl run my-pod --image=nginx --dry-run=client -o yaml > pod.yaml
```

**⚠️ Common Mistakes:**
- Pods are NOT self-healing. Use Deployment for production workloads.
- Labels on pod must match the Deployment/Service selector.

---

## 3. ReplicaSet {#replicaset}

**Purpose:** Ensures a specified number of Pod replicas are running at any time. Usually managed by Deployment — rarely created directly.

```
ReplicaSet (replicas: 3)
├── Pod 1  (running)
├── Pod 2  (running)
└── Pod 3  (crashed → ReplicaSet creates Pod 4 to replace)
```

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: my-rs
spec:
  replicas: 3               # 🔴 Required — number of pod copies
  selector:                 # 🔴 Required — how to identify owned pods
    matchLabels:
      app: my-app
  template:                 # 🔴 Required — pod blueprint
    metadata:
      labels:
        app: my-app         # Must match selector!
    spec:
      containers:
        - name: app
          image: nginx:1.25
```

```bash
kubectl get replicasets
kubectl scale rs my-rs --replicas=5
kubectl describe rs my-rs
```

> ⚠️ In practice, you almost never create ReplicaSets directly. Use Deployments instead — they manage ReplicaSets for you.

---

## 4. Deployment {#deployment}

**Purpose:** Manages ReplicaSets to provide declarative updates, rollouts, rollbacks, and scaling for stateless applications.

```
Deployment
└── ReplicaSet v1 (old — 0 replicas after update)
└── ReplicaSet v2 (current — 3 replicas)
    ├── Pod 1
    ├── Pod 2
    └── Pod 3
```

```yaml
# ─── DECLARATIVE ─────────────────────────────────────────────
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: default
  labels:
    app: my-app
  annotations:
    kubernetes.io/change-cause: "Update to v2 — added feature X"  # 🟢 Tracks rollout reason
spec:
  replicas: 3               # 🟡 Default: 1

  selector:                 # 🔴 Required — must match template labels
    matchLabels:
      app: my-app

  strategy:                 # 🟡 Update strategy
    type: RollingUpdate     # Default
    rollingUpdate:
      maxSurge: 1           # Allow 1 extra pod during update
      maxUnavailable: 0     # Never have 0 available pods (zero-downtime)

  template:                 # 🔴 Required — Pod template
    metadata:
      labels:
        app: my-app         # Must match selector above!
    spec:
      containers:
        - name: app
          image: myapp:v2
          ports:
            - containerPort: 8080
          resources:
            requests: { cpu: "100m", memory: "128Mi" }
            limits:   { cpu: "500m", memory: "512Mi" }
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
```

```bash
# ─── IMPERATIVE ──────────────────────────────────────────────
kubectl create deployment my-app --image=myapp:v1 --replicas=3

# Rollout management
kubectl rollout status deployment/my-app        # Watch rollout progress
kubectl rollout history deployment/my-app       # See revision history
kubectl rollout undo deployment/my-app          # Rollback to previous
kubectl rollout undo deployment/my-app --to-revision=2  # Rollback to v2

# Scaling
kubectl scale deployment my-app --replicas=5

# Update image (triggers rolling update)
kubectl set image deployment/my-app app=myapp:v2

# Pause/resume rollout
kubectl rollout pause deployment/my-app
kubectl rollout resume deployment/my-app
```

---

## 5. Service {#service}

**Purpose:** Provides a stable network endpoint (virtual IP + DNS name) to access a set of Pods. Pods come and go — Service IP stays constant.

```
Service Types:
─────────────────────────────────────────────────────────
ClusterIP (default)  → Accessible only inside cluster
NodePort             → Accessible via <NodeIP>:<NodePort>
LoadBalancer         → Accessible via cloud load balancer IP
ExternalName         → DNS alias to external service
Headless (None)      → No virtual IP, direct pod DNS records
```

```yaml
# ─── ClusterIP (internal) ────────────────────────────────────
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: ClusterIP             # 🟢 Default (can omit)
  selector:
    app: my-app               # 🔴 Route to pods with this label
  ports:
    - port: 80                # 🔴 Service port (clients use this)
      targetPort: 8080        # 🟡 Pod port (container listens here)
      protocol: TCP           # 🟢 Default TCP
      name: http              # 🟢 Name the port

---
# ─── NodePort (external access) ──────────────────────────────
apiVersion: v1
kind: Service
metadata:
  name: my-nodeport-service
spec:
  type: NodePort
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080         # 🟢 Range: 30000-32767. Auto-assigned if omitted.

---
# ─── LoadBalancer (cloud) ────────────────────────────────────
apiVersion: v1
kind: Service
metadata:
  name: my-lb-service
spec:
  type: LoadBalancer
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080

---
# ─── Headless Service (no ClusterIP) ─────────────────────────
apiVersion: v1
kind: Service
metadata:
  name: my-headless
spec:
  clusterIP: None             # Makes it headless
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
# Use case: StatefulSet — each pod gets its own DNS record
# Pod DNS: pod-0.my-headless.default.svc.cluster.local
```

```bash
kubectl create service clusterip my-svc --tcp=80:8080
kubectl expose deployment my-app --type=ClusterIP --port=80 --target-port=8080
kubectl get services
kubectl describe service my-service
```

**DNS Pattern:** `<service>.<namespace>.svc.cluster.local`

---

## 6. ConfigMap {#configmap}

**Purpose:** Stores non-sensitive configuration data as key-value pairs. Injected into pods as env vars or mounted as files.

```yaml
# ─── DECLARATIVE ─────────────────────────────────────────────
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # Simple key-value
  APP_ENV: "production"
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"
  
  # Multi-line value (file content)
  app.conf: |
    server {
      listen 80;
      server_name example.com;
    }
  
  database.properties: |
    host=db-service
    port=5432
    dbname=myapp
```

```bash
# ─── IMPERATIVE ──────────────────────────────────────────────
kubectl create configmap app-config --from-literal=APP_ENV=production
kubectl create configmap app-config --from-file=app.conf
kubectl create configmap app-config --from-env-file=.env
```

**Using ConfigMap in Pods:**
```yaml
# Option 1: As individual env vars
env:
  - name: APP_ENV
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: APP_ENV

# Option 2: All keys as env vars
envFrom:
  - configMapRef:
      name: app-config

# Option 3: Mount as files
volumes:
  - name: config-vol
    configMap:
      name: app-config
containers:
  - volumeMounts:
      - name: config-vol
        mountPath: /etc/config   # Each key becomes a file
```

---

## 7. Secret {#secret}

**Purpose:** Stores sensitive data (passwords, tokens, keys). Base64-encoded (NOT encrypted by default — use encryption at rest for true security).

```yaml
# ─── DECLARATIVE ─────────────────────────────────────────────
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque                  # Generic secret (most common)
data:
  username: YWRtaW4=          # base64 encoded "admin"
  password: c3VwZXJzZWNyZXQ= # base64 encoded "supersecret"

# Other types:
# kubernetes.io/dockerconfigjson  → Image pull secret
# kubernetes.io/tls               → TLS certificate
# kubernetes.io/service-account-token → SA token
```

```bash
# ─── IMPERATIVE ──────────────────────────────────────────────
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password=supersecret

kubectl create secret tls my-tls \
  --cert=server.crt \
  --key=server.key

kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=myuser \
  --docker-password=mypass

# Encode/decode
echo -n "mypassword" | base64       # encode
echo "bXlwYXNzd29yZA==" | base64 -d # decode
```

---

## 8. PersistentVolume & PersistentVolumeClaim {#storage}

**Purpose:** Provide persistent storage that survives pod restarts. PV = cluster storage resource. PVC = pod's request for storage.

```
Static Provisioning:                Dynamic Provisioning:
──────────────────────              ──────────────────────
Admin creates PV                    Dev creates PVC with StorageClass
        ↓                                    ↓
Dev creates PVC               Cloud provider auto-creates PV
        ↓                                    ↓
K8s binds PVC to PV           K8s binds PVC to PV automatically
        ↓                                    ↓
Pod references PVC            Pod references PVC
```

```yaml
# ─── PersistentVolume (admin creates) ────────────────────────
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  capacity:
    storage: 10Gi             # 🔴 Size
  accessModes:
    - ReadWriteOnce           # 🔴 RWO | ROX | RWX | RWOP
  persistentVolumeReclaimPolicy: Retain  # Retain | Delete | Recycle
  storageClassName: standard
  hostPath:                   # For local dev/testing only
    path: /data/my-pv

---
# ─── PersistentVolumeClaim (developer creates) ───────────────
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard  # Must match PV or StorageClass

---
# ─── StorageClass (for dynamic provisioning) ─────────────────
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs   # Cloud provider provisioner
parameters:
  type: gp3
  encrypted: "true"
reclaimPolicy: Delete
allowVolumeExpansion: true
```

**Access Modes:**
| Mode | Short | Meaning |
|------|-------|---------|
| ReadWriteOnce | RWO | One node can read+write |
| ReadOnlyMany | ROX | Many nodes can read |
| ReadWriteMany | RWX | Many nodes can read+write |
| ReadWriteOncePod | RWOP | One pod can read+write |

---

## 9. Job & CronJob {#jobs}

**Purpose:** Job runs a task to completion. CronJob runs Jobs on a schedule.

```yaml
# ─── Job ─────────────────────────────────────────────────────
apiVersion: batch/v1
kind: Job
metadata:
  name: data-processor
spec:
  completions: 1              # 🟢 Number of successful completions needed
  parallelism: 1              # 🟢 How many pods run in parallel
  backoffLimit: 4             # 🟢 Retry limit on failure
  activeDeadlineSeconds: 600  # 🟢 Kill if not complete in 10 min
  ttlSecondsAfterFinished: 100  # 🟢 Auto-delete job after 100s
  template:
    spec:
      restartPolicy: OnFailure  # 🔴 Required for Jobs: OnFailure | Never
      containers:
        - name: processor
          image: python:3.11
          command: ["python", "process.py"]

---
# ─── CronJob ─────────────────────────────────────────────────
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-report
spec:
  schedule: "0 2 * * *"       # 🔴 Cron format: "minute hour day month weekday"
                               # "0 2 * * *" = 2:00 AM daily
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  concurrencyPolicy: Forbid    # Allow | Forbid | Replace
  startingDeadlineSeconds: 60  # Max delay before skipping run
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: reporter
              image: myreporter:v1
```

```bash
kubectl create job data-job --image=python:3.11 -- python process.py
kubectl create cronjob daily-job --image=busybox --schedule="0 2 * * *" -- echo hello
kubectl get jobs
kubectl get cronjobs
```

---

## 10. DaemonSet {#daemonset}

**Purpose:** Ensures one (and only one) Pod runs on EVERY node. Perfect for node-level agents.

```
DaemonSet use cases:
  - Log collectors (Fluentd, Filebeat)
  - Monitoring agents (Prometheus Node Exporter)
  - Network plugins (Calico, Cilium)
  - Security scanners
```

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: log-collector
  template:
    metadata:
      labels:
        app: log-collector
    spec:
      tolerations:              # Often needed to run on master nodes
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule
      containers:
        - name: fluentd
          image: fluent/fluentd:v1.16
          resources:
            limits:
              memory: 200Mi
          volumeMounts:
            - name: varlog
              mountPath: /var/log
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
```

---

## 11. StatefulSet {#statefulset}

**Purpose:** Like Deployment but for stateful applications. Pods get stable, predictable identities and persistent storage.

```
StatefulSet: my-db (replicas: 3)
├── my-db-0  → PVC: data-my-db-0  → stable DNS: my-db-0.my-svc
├── my-db-1  → PVC: data-my-db-1  → stable DNS: my-db-1.my-svc
└── my-db-2  → PVC: data-my-db-2  → stable DNS: my-db-2.my-svc

Ordered startup:  0 → 1 → 2
Ordered shutdown: 2 → 1 → 0
```

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: my-db
spec:
  serviceName: "my-db-svc"      # 🔴 Required — govering headless service
  replicas: 3
  selector:
    matchLabels:
      app: my-db
  template:
    metadata:
      labels:
        app: my-db
    spec:
      containers:
        - name: postgres
          image: postgres:15
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: password
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:           # 🔴 Creates PVC per pod automatically
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

---

## 12. Ingress {#ingress}

**Purpose:** HTTP/HTTPS routing into the cluster. One external IP routes to multiple services based on hostname or path.

```
Internet
    ↓
LoadBalancer (cloud)
    ↓
Ingress Controller (nginx/traefik/etc)
    ↓
Ingress Rules:
    /api/*        → api-service:80
    /app/*        → frontend-service:80
    api.example.com → api-service:80
    app.example.com → frontend-service:80
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx       # 🟡 Which ingress controller to use
  
  tls:                          # 🟢 HTTPS configuration
    - hosts:
        - example.com
      secretName: tls-secret    # Secret containing cert + key
  
  rules:
    - host: example.com         # 🟢 Omit for catch-all
      http:
        paths:
          - path: /api
            pathType: Prefix    # Prefix | Exact | ImplementationSpecific
            backend:
              service:
                name: api-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

---

## 13. NetworkPolicy {#networkpolicy}

**Purpose:** Firewall rules for pods. By default, all pods can talk to all other pods. NetworkPolicy restricts this.

```yaml
# ─── Default deny all ingress ────────────────────────────────
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}               # {} = applies to ALL pods in namespace
  policyTypes:
    - Ingress                   # Block all incoming traffic

---
# ─── Allow specific ingress ──────────────────────────────────
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
spec:
  podSelector:
    matchLabels:
      app: api                  # Apply to api pods
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend     # Only from frontend pods
        - namespaceSelector:
            matchLabels:
              name: monitoring  # Or from monitoring namespace
      ports:
        - protocol: TCP
          port: 8080
```

---

## 14. ServiceAccount & RBAC {#rbac}

**Purpose:** Control who/what can access the Kubernetes API. ServiceAccount = Pod identity. Role = permissions. RoleBinding = assigns Role to SA.

```
User/ServiceAccount  →  RoleBinding  →  Role  →  Resources + Verbs
```

```yaml
# ─── ServiceAccount ──────────────────────────────────────────
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-sa
  namespace: default
automountServiceAccountToken: false  # 🟡 Security: disable if not needed

---
# ─── Role (namespace-scoped) ─────────────────────────────────
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: default
rules:
  - apiGroups: [""]             # "" = core API group
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

---
# ─── RoleBinding ─────────────────────────────────────────────
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-binding
  namespace: default
subjects:
  - kind: ServiceAccount
    name: my-app-sa
    namespace: default
  - kind: User                  # Human user
    name: jane
    apiGroup: rbac.authorization.k8s.io
  - kind: Group                 # User group
    name: developers
    apiGroup: rbac.authorization.k8s.io
roleRef:                        # The Role to bind (cannot change after creation)
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

**Common verbs:** `get`, `list`, `watch`, `create`, `update`, `patch`, `delete`, `deletecollection`

```bash
kubectl create serviceaccount my-app-sa
kubectl create role pod-reader --verb=get,list --resource=pods
kubectl create rolebinding my-binding --role=pod-reader --serviceaccount=default:my-app-sa
kubectl auth can-i get pods --as=system:serviceaccount:default:my-app-sa
```

---

## 15. HorizontalPodAutoscaler {#hpa}

**Purpose:** Automatically scales deployment replicas based on CPU/memory metrics or custom metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:               # 🔴 What to scale
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2                # 🔴 Never go below this
  maxReplicas: 10               # 🔴 Never go above this
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70  # Scale when avg CPU > 70%
    - type: Resource
      resource:
        name: memory
        target:
          type: AverageValue
          averageValue: 512Mi
```

```bash
kubectl autoscale deployment my-app --min=2 --max=10 --cpu-percent=70
kubectl get hpa
kubectl describe hpa my-app-hpa
```

---

## 16. ResourceQuota & LimitRange {#quotas}

```yaml
# ─── ResourceQuota (namespace total limits) ──────────────────
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: production
spec:
  hard:
    requests.cpu: "4"           # Total CPU requests in namespace
    requests.memory: 4Gi
    limits.cpu: "8"
    limits.memory: 8Gi
    pods: "20"                  # Max 20 pods
    services: "10"
    persistentvolumeclaims: "5"
    secrets: "20"
    configmaps: "20"

---
# ─── LimitRange (per-pod/container defaults) ─────────────────
apiVersion: v1
kind: LimitRange
metadata:
  name: team-limits
  namespace: production
spec:
  limits:
    - type: Container
      default:                  # Default limits if not specified
        cpu: "500m"
        memory: "256Mi"
      defaultRequest:           # Default requests if not specified
        cpu: "100m"
        memory: "128Mi"
      max:                      # Container can't exceed this
        cpu: "2"
        memory: "2Gi"
      min:                      # Container must request at least this
        cpu: "50m"
        memory: "64Mi"
    - type: Pod
      max:
        cpu: "4"
        memory: "4Gi"
```

---

## 17. CustomResourceDefinition {#crd}

**Purpose:** Extend the Kubernetes API with your own resource types.

```yaml
# ─── Define the CRD ──────────────────────────────────────────
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: aiagents.example.com     # Must be: <plural>.<group>
spec:
  group: example.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                model:
                  type: string
                replicas:
                  type: integer
                  minimum: 1
  scope: Namespaced              # Namespaced | Cluster
  names:
    plural: aiagents
    singular: aiagent
    kind: AiAgent
    shortNames: ["aia"]

---
# ─── Create an instance of the CRD ──────────────────────────
apiVersion: example.com/v1
kind: AiAgent
metadata:
  name: my-agent
spec:
  model: gpt-4o
  replicas: 2
```

```bash
kubectl get crds
kubectl get aiagents          # or: kubectl get aia
kubectl describe crd aiagents.example.com
```
