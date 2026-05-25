# Production-level Pods & Workload Management in Kubernetes

Purpose: Comprehensive study notes covering fundamentals through advanced production practices, with commands, examples, exercises and quiz questions.

**Audience:** Engineers preparing to design, operate, and troubleshoot production Kubernetes workloads.

---

**Table of Contents**
- Introduction
- Core Concepts
- Scheduling & Placement
- Resource Management (CPU/Memory/Storage)
- Pod Quality-of-Service and Resource Tuning
- Availability & Disruption Management
- Updates, Rollouts, and Strategies
- Autoscaling: HPA, VPA, and Cluster Autoscaler
- Security & Runtime Hardening
- Networking and Service Mesh considerations
- Observability, Logging, and Debugging
- Storage and Stateful Workloads
- Advanced Patterns: Sidecars, Init Containers, Jobs/CronJobs
- Practical Commands Cheat Sheet
- Exercises (with hints/answers)
- Quiz Questions (with answers)

---

**Introduction**
- Goal: Run reliable, scalable, secure workloads. Production readiness requires attention to placement, resources, lifecycle, observability, security, and SRE practices.

---

**Core Concepts**
- Pod: smallest deployable unit. One or more containers share network namespace and volumes.
- Controller patterns: Deployment (stateless), StatefulSet (stateful), DaemonSet (per-node), Job/CronJob (batch/cron), ReplicaSet (scaling abstraction backing Deployments).
- Node: compute on which pods run. Understand labels, capacity and allocatable.
- API primitives: PodSpec fields (containers, resources, probes, affinity, tolerations, volumes, securityContext).

---

**Scheduling & Placement**
- NodeSelector: simple node matching by label.
- NodeAffinity: preferred/required affinity with topology constraints.
- PodAffinity/AntiAffinity: co-locate or separate pods for performance/availability.
- Taints & Tolerations: prevent pods from scheduling onto nodes unless tolerated.
- Topology Spread Constraints and Pod Topology Spread: distribute pods across failure domains.
- Best practices:
  - Use topologySpread to avoid blast radius.
  - Use soft `preferredDuringSchedulingIgnoredDuringExecution` when you want flexibility.
  - Avoid over-constraining with required affinities unless necessary.

Example: required node affinity snippet

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: node-role.kubernetes.io/worker
          operator: In
          values:
          - "true"
```

---

**Resource Management**
- Requests vs Limits: `requests` are used for scheduling; `limits` enforce runtime cgroup caps.
- CPU measured in cores/millicores; Memory in bytes.
- Enforce both request & limit for production pods to avoid noisy neighbors.
- ResourceQuota and LimitRange: cluster/namespace-level controls to enforce policies.
- Ephemeral storage: `emptyDir` and local storage also need quotas and monitoring.

Best practices:
- Set both `resources.requests` and `resources.limits` for each container.
- Tune requests based on observed usage (metrics) not guesses.

Example:

```yaml
resources:
  requests:
    cpu: "200m"
    memory: "256Mi"
  limits:
    cpu: "1"
    memory: "1Gi"
```

---

**Pod Quality-of-Service (QoS)**
- QoS classes: Guaranteed (requests==limits for every container), Burstable (requests set but < limits), BestEffort (no requests).
- Priority: Guaranteed > Burstable > BestEffort for eviction and node pressure behavior.
- Use Guaranteed for latency-sensitive critical workloads.

---

**Health Checks & Lifecycle Management**
- LivenessProbe: restart container when unhealthy.
- ReadinessProbe: control traffic; pod not added to endpoints until ready.
- StartupProbe: use for slow-starting apps to avoid premature liveness restarts.
- PreStop hooks: graceful shutdown steps before SIGTERM completes.
- TerminationGracePeriodSeconds: give apps time to close connections; coordinate with external load balancers.

Probes example:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  tcpSocket:
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

Shutdown best practice:
- Implement `SIGTERM` handling in app to stop accepting new work and finish in-flight requests.
- Use preStop hook to cut external dependencies gracefully.

---

**Availability & Disruption Management**
- PodDisruptionBudget (PDB): controls voluntary disruptions (drain, upgrade) to keep minimum available pods.
- Use PDBs for stateful components and for critical services.
- Multiple PDBs can interact; ensure they don't block normal operations.

PDB example:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web
```

- Rolling updates & maxUnavailable/maxSurge controls on Deployment to tune risk vs speed.
- Use readiness gates with custom controllers if you need more complex promotion logic.

---

**Updates, Rollouts, and Strategies**
- Deployments provide rolling update strategies; you can set `maxUnavailable` and `maxSurge`.
- Blue/Green & Canary: safer strategies for production. Use ingress/traffic-splitting (service mesh or Ingress) to shift traffic.
- Use `kubectl rollout` to manage rollouts.

Commands:
- `kubectl rollout status deployment/myapp` — watch rollout.
- `kubectl rollout undo deployment/myapp` — rollback.

Canary via labels + service selector:
- Create a second Deployment with `canary: "true"` label and adjust Service/Ingress or use Istio/TrafficSplit to route a %.

---

**Autoscaling**
- Horizontal Pod Autoscaler (HPA): scales replicas based on CPU, memory, or custom metrics.
- Vertical Pod Autoscaler (VPA): adjusts container requests/limits (use carefully in managed mode or with recommender only).
- Cluster Autoscaler: scales nodes based on unschedulable pods.

HPA example (CPU-based):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
```

Best practices:
- Use HPA with proper requests configured; HPA scales based on request targets.
- Monitor and set sensible min/max replicas to avoid sudden scale-to-zero for critical services.

---

**Security & Runtime Hardening**
- SecurityContext & PodSecurity: run as non-root user, drop capabilities, set seccomp and AppArmor profiles.
- Pod Security Admission (PSA) replaces PodSecurityPolicy (deprecated).
- Secrets: use `Secret` objects, mount as volumes or envFrom; use external secret stores for higher security.
- NetworkPolicy: restrict pod-to-pod traffic using label-based rules.

Security snippet:

```yaml
securityContext:
  runAsUser: 1000
  runAsGroup: 3000
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
```

---

**Networking & Service Mesh**
- Services (ClusterIP, NodePort, LoadBalancer), Endpoints and EndpointsSlices.
- CNI: choose appropriate CNI plugin (Calico, Cilium, Flannel) depending on policy/performance needs.
- Service meshes (Istio, Linkerd) add sidecar proxies, observability and advanced traffic control—trade-offs: complexity, resource overhead.
- Use headless Services and StatefulSet for stable network identities.

---

**Observability, Logging & Debugging**
- Metrics: kube-state-metrics, cAdvisor, node-exporter, Prometheus.
- Tracing: OpenTelemetry, Jaeger.
- Logging: centralized logging via Fluentd/FluentBit → Elasticsearch/Cloud logging.
- Use `kubectl` commands to debug pods:
  - `kubectl get pods -o wide`
  - `kubectl describe pod <pod>`
  - `kubectl logs <pod> [-c container]` and `kubectl logs --previous` for crash loops
  - `kubectl exec -it <pod> -- /bin/sh`
  - `kubectl port-forward pod/<pod> 8080:8080`
  - `kubectl top pod` (requires metrics-server)

Debugging tips:
- For CrashLoopBackOff: `kubectl logs --previous` and `kubectl describe` for events.
- For OOMKilled: inspect memory usage and `kubectl describe pod` for OOM message.
- For scheduling failures: `kubectl describe pod` shows Unschedulable events.

---

**Storage & Stateful Workloads**
- PersistentVolume (PV) and PersistentVolumeClaim (PVC) abstractions.
- StorageClass and dynamic provisioning via CSI drivers.
- ReclaimPolicy: Retain/Delete for PVs.
- StatefulSet gives stable identity and stable storage; use for databases.

Example PVC:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 10Gi
```

Best practices:
- Prefer ReadWriteOnce for single-writer databases; use ReadWriteMany carefully.
- Separate storage pools for I/O intensive workloads.

---

**Advanced Patterns**
- Sidecar containers: logging, proxy, syncer patterns.
- Init containers: run pre-start tasks (migrations, templating) before app starts.
- Ephemeral containers: debugging helpers (attach debug tools to running pod).
- Jobs and CronJobs for batch/periodic tasks.

---

**Practical Commands Cheat Sheet**
- List pods: `kubectl get pods -n <ns> -o wide`
- Describe: `kubectl describe pod/<pod> -n <ns>`
- Logs: `kubectl logs -f pod/<pod> -c <container>`
- Exec: `kubectl exec -it pod/<pod> -c <container> -- /bin/sh`
- Apply manifest: `kubectl apply -f manifest.yaml`
- Rollout status: `kubectl rollout status deployment/<name>`
- Scale: `kubectl scale deployment/<name> --replicas=5`
- Port-forward: `kubectl port-forward svc/<service> 8080:80`
- Copy files: `kubectl cp localfile <pod>:/path`
- View events: `kubectl get events -n <ns> --sort-by=.metadata.creationTimestamp`

---

**Exercises**
1) Resource tuning: Deploy a simple nginx Deployment with 1 replica. Add realistic `requests`/`limits`. Use `kubectl top` to observe behavior while sending load with `hey` or `ab`.
   - Hint: create a load generator pod inside the cluster to avoid external networking noise.
   - Answer: Observe metrics, then adjust `requests` to average observed CPU and set `limits` to 2x expected peak.

2) Resilience under node failure: Create a 3-replica Deployment with topologySpreadConstraints across zones (or node labels). Simulate node failure by cordoning and draining a node. Verify pods are redistributed.
   - Hint: use `kubectl cordon <node>`, `kubectl drain <node> --ignore-daemonsets --delete-emptydir-data`.

3) Canary deployment: Implement a canary by creating `web` and `web-canary` Deployments and configure an Ingress rule or use Service selector to route 10% to canary (prefer using a Service mesh or manual header-based splitting).

4) Debugging CrashLoopBackOff: Deploy a pod with a command that immediately exits. Use `kubectl logs --previous` and fix by adding a sleep or proper command.

5) Implement PodDisruptionBudget for an HA service and demonstrate draining a node while keeping minimum availability.

6) NetworkPolicy exercise: Deploy two apps `frontend` and `backend` in same namespace. Lock down `backend` to accept traffic only from `frontend` label using NetworkPolicy.
   - Hint: test connectivity with `kubectl exec` curl from other pods.

7) Stateful workload: Deploy a StatefulSet with PVC template. Observe ordering and identity behavior by scaling down and up.

---

**Quiz Questions**
(Answers at the end)

1. What Kubernetes object should you use to ensure at least N replicas remain available during voluntary disruptions?
  A) ReplicaSet  B) PodDisruptionBudget  C) PodSecurityPolicy  D) StatefulSet

2. Which QoS class gives a pod the highest eviction priority protection?
  A) BestEffort  B) Burstable  C) Guaranteed  D) PriorityClass

3. To prevent a pod from being scheduled on nodes labeled `gpu=true`, which mechanism do you use?
  A) NodeSelector  B) Taints and Tolerations  C) PodSecurity  D) ResourceQuota

4. Which probe should be used to determine when a pod is ready to receive traffic?
  A) LivenessProbe  B) ReadinessProbe  C) StartupProbe  D) HealthCheck

5. HPA scaling decisions are influenced by which pod field?
  A) limits.cpu  B) requests.cpu  C) metadata.labels  D) ephemeral-storage

6. Which resource(s) does a Guaranteed QoS pod require?
  A) No resource requests  B) Requests but no limits  C) Requests equal to limits for all containers  D) Only limits

7. Which object allows you to run a pod on every node in the cluster?
  A) ReplicaSet  B) DaemonSet  C) StatefulSet  D) Deployment

---

**Quiz Answers**
1: B  2: C  3: B (use taint on nodes, admit with toleration if pods should run)  4: B  5: B  6: C  7: B

---

**Answers & Hints to Exercises**
- Exercise 1: Use `kubectl apply -f nginx-deploy.yaml`, then `kubectl run -it --rm loadgen --image=busybox -- /bin/sh` and `wget -q -O- http://nginx` in a loop. Use `kubectl top pod` and adjust `requests`.
- Exercise 2: Label nodes with `failure-domain` and set `topologySpreadConstraints` with `topologyKey: failure-domain`. Use cordon/drain.
- Exercise 3: Create service `web-svc` selecting pods with `app:web` and gradually add `canary:true` pods to service by modifying selector (or prefer service mesh traffic split features).
- Exercise 4: Use `kubectl apply` of a pod spec that exits; inspect logs with `kubectl logs --previous`.
- Exercise 5: `kubectl apply -f pdb.yaml` and then `kubectl drain <node>`.
- Exercise 6: Create a NetworkPolicy `allow-from-frontend` that selects backend pods and allows ingress from pods with label `app: frontend`.
- Exercise 7: Deploy a StatefulSet with PVC template and test `kubectl scale statefulset <name> --replicas=0` then back up to verify persistent volumes stay associated.

---

**References & Further Reading**
- Kubernetes official docs: scheduling, QoS, probes, controllers, storage, network policy.
- CNCF projects: Prometheus, Fluentd, Envoy/Istio, Cilium.
- Blogs and SRE posts on graceful shutdown and rollout strategies.

---

File saved in repository: Production_Pods_Workload_Management.md
