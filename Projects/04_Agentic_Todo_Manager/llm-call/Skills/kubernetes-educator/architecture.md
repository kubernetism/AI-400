# Kubernetes Architecture — Deep Dive Reference

## Table of Contents
1. [The Big Picture](#big-picture)
2. [Control Plane Deep Dive](#control-plane)
3. [Worker Node Deep Dive](#worker-node)
4. [Request Flow: What happens when you run kubectl apply](#request-flow)
5. [etcd: The Brain of Kubernetes](#etcd)
6. [Networking Architecture](#networking)
7. [Storage Architecture](#storage)

---

## 1. The Big Picture {#big-picture}

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          KUBERNETES CLUSTER                                  ║
║                                                                              ║
║  👤 Developer/Admin                                                          ║
║      │                                                                       ║
║      │ kubectl apply -f app.yaml                                            ║
║      ▼                                                                       ║
║  ┌─────────────────────────────────────────────────────────┐                ║
║  │                   CONTROL PLANE                         │                ║
║  │                                                         │                ║
║  │  ┌──────────────┐         ┌─────────────────────────┐  │                ║
║  │  │  API Server  │◄────────│          etcd           │  │                ║
║  │  │  :6443       │ stores/ │ (distributed key-value  │  │                ║
║  │  │              │ reads   │  store — cluster state) │  │                ║
║  │  └──────┬───────┘         └─────────────────────────┘  │                ║
║  │         │                                               │                ║
║  │    ┌────┴──────────────────────────┐                   │                ║
║  │    │                               │                   │                ║
║  │    ▼                               ▼                   │                ║
║  │ ┌──────────────┐          ┌─────────────────┐          │                ║
║  │ │  Scheduler   │          │   Controller     │          │                ║
║  │ │              │          │   Manager        │          │                ║
║  │ │ Watches for  │          │                  │          │                ║
║  │ │ unscheduled  │          │ Runs controllers:│          │                ║
║  │ │ Pods,        │          │ - ReplicaSet ctrl│          │                ║
║  │ │ assigns to   │          │ - Deployment ctrl│          │                ║
║  │ │ best node    │          │ - Job controller │          │                ║
║  │ │              │          │ - Node controller│          │                ║
║  │ └──────────────┘          └─────────────────┘          │                ║
║  └─────────────────────────────────────────────────────────┘                ║
║          │                      │                   │                       ║
║          │ (watches API Server via informers)        │                      ║
║          ▼                      ▼                   ▼                       ║
║  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  WORKER NODES    ║
║  │   Node 1     │    │   Node 2     │    │   Node 3     │                  ║
║  │              │    │              │    │              │                  ║
║  │ ┌──────────┐ │    │ ┌──────────┐ │    │ ┌──────────┐ │                  ║
║  │ │ Pod A    │ │    │ │ Pod B    │ │    │ │ Pod C    │ │                  ║
║  │ │ ┌──────┐ │ │    │ │ ┌──────┐ │ │    │ │ ┌──────┐ │ │                  ║
║  │ │ │ ctr1 │ │ │    │ │ │ ctr1 │ │ │    │ │ │ ctr1 │ │ │                  ║
║  │ │ └──────┘ │ │    │ │ └──────┘ │ │    │ │ └──────┘ │ │                  ║
║  │ └──────────┘ │    │ └──────────┘ │    │ └──────────┘ │                  ║
║  │              │    │              │    │              │                  ║
║  │  kubelet     │    │  kubelet     │    │  kubelet     │                  ║
║  │  kube-proxy  │    │  kube-proxy  │    │  kube-proxy  │                  ║
║  │  containerd  │    │  containerd  │    │  containerd  │                  ║
║  └──────────────┘    └──────────────┘    └──────────────┘                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Control Plane Deep Dive {#control-plane}

### API Server (kube-apiserver)

The **single entry point** for all cluster operations. Everything goes through it.

```
                    ┌────────────────────────────────────┐
                    │           API Server               │
                    │                                    │
kubectl ──────────► │  1. Authenticate (Who are you?)   │
Helm    ──────────► │  2. Authorize   (Can you do this?) │
CI/CD   ──────────► │  3. Validate    (Is YAML valid?)  │
                    │  4. Admit       (Mutation webhooks)│
                    │  5. Persist     → etcd             │
                    │  6. Notify      → controllers      │
                    └────────────────────────────────────┘
```

**Key facts:**
- Exposes REST API on port 6443 (HTTPS)
- Stateless — all state is in etcd
- All other components talk TO the API server (not to each other)
- Supports watch mechanism — components subscribe to changes

### Scheduler (kube-scheduler)

```
    New Pod created (no node assigned)
              │
              ▼
    ┌─────────────────────┐
    │  Filter Phase       │  ← Remove nodes that can't run the Pod
    │  (Predicates)       │    (Not enough CPU, taint, affinity, etc.)
    └─────────┬───────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Score Phase        │  ← Rank remaining nodes by suitability
    │  (Priorities)       │    (Least loaded, best fit, etc.)
    └─────────┬───────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Bind Phase         │  ← Write node assignment to API server
    └─────────────────────┘
```

### Controller Manager

Runs multiple **control loops** (controllers), each watching one resource type:

```
┌──────────────────────────────────────────────────────┐
│                 Controller Manager                    │
│                                                      │
│  ┌─────────────────┐   Loop: "Is actual = desired?" │
│  │ ReplicaSet Ctrl │   If not → create/delete pods  │
│  └─────────────────┘                                │
│                                                      │
│  ┌─────────────────┐   Loop: "Is rollout complete?" │
│  │ Deployment Ctrl │   Manages ReplicaSet updates   │
│  └─────────────────┘                                │
│                                                      │
│  ┌─────────────────┐   Loop: "Is node healthy?"     │
│  │   Node Ctrl     │   Marks node NotReady if down  │
│  └─────────────────┘                                │
│                                                      │
│  ┌─────────────────┐   Loop: "Did Job complete?"    │
│  │   Job Ctrl      │   Creates pods, tracks success │
│  └─────────────────┘                                │
└──────────────────────────────────────────────────────┘
```

### etcd

```
etcd is a distributed, reliable key-value store.
It is the SOURCE OF TRUTH for all cluster state.

What's stored:
  /registry/pods/default/my-pod       → Pod spec + status
  /registry/deployments/default/app   → Deployment definition
  /registry/services/default/nginx    → Service definition
  /registry/secrets/default/db-pass   → Encrypted secrets
  /registry/nodes/node-1              → Node information

Key properties:
  ✓ Distributed (multiple etcd nodes for HA)
  ✓ Consistent (Raft consensus algorithm)
  ✓ Watch API (notifies watchers of changes)
  ✗ NOT human-readable — always access via API Server!
```

---

## 3. Worker Node Deep Dive {#worker-node}

```
┌─────────────────────────────────────────────────────────┐
│                     WORKER NODE                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │                    kubelet                        │  │
│  │                                                   │  │
│  │  • Registers node with API server                 │  │
│  │  • Watches API server for Pods assigned to node   │  │
│  │  • Tells container runtime to start/stop containers│  │
│  │  • Reports pod status back to API server          │  │
│  │  • Runs liveness/readiness/startup probes         │  │
│  │  • Mounts volumes into pods                       │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │ CRI (Container Runtime Interface)│
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Container Runtime                      │  │
│  │         (containerd / CRI-O)                      │  │
│  │                                                   │  │
│  │  Pulls images, creates/runs containers            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │                 kube-proxy                        │  │
│  │                                                   │  │
│  │  • Maintains iptables/ipvs rules on node          │  │
│  │  • Implements Service virtual IP routing          │  │
│  │  • Enables pod-to-pod and pod-to-service traffic  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Pod A            Pod B            Pod C           │ │
│  │  ┌──────────┐     ┌──────────┐    ┌──────────┐    │ │
│  │  │container │     │container │    │container │    │ │
│  │  │  +       │     │  +       │    │  +       │    │ │
│  │  │pause ctr │     │pause ctr │    │pause ctr │    │ │
│  │  └──────────┘     └──────────┘    └──────────┘    │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Request Flow: kubectl apply -f app.yaml {#request-flow}

```
Step 1: kubectl reads app.yaml, sends HTTP POST to API Server

Step 2: API Server
        ├── Authentication: Validates user identity (cert/token)
        ├── Authorization: RBAC check (can this user create Deployments?)
        ├── Admission: Mutation webhooks (inject sidecars, set defaults)
        ├── Validation: Schema validation (is the YAML structurally correct?)
        └── Persistence: Writes to etcd

Step 3: Deployment Controller (in Controller Manager)
        └── Watches API server → sees new Deployment
        └── Creates ReplicaSet object

Step 4: ReplicaSet Controller
        └── Sees ReplicaSet → creates Pod objects (no node assigned yet)

Step 5: Scheduler
        └── Sees Pods with no node → scores nodes → assigns node to each Pod

Step 6: kubelet on assigned node
        └── Sees Pod assigned to it → tells container runtime to pull image
        └── Container runtime pulls image, creates containers
        └── kubelet reports status back to API server (Running)

Step 7: kube-proxy on all nodes
        └── If Service exists → updates iptables rules
        └── Traffic to Service VIP now routes to Pod IPs
```

---

## 5. Networking Architecture {#networking}

```
Pod-to-Pod Communication (flat network):
─────────────────────────────────────────
Every Pod gets a unique cluster IP.
All pods can communicate with any other pod directly.
No NAT required for pod-to-pod traffic.

                Pod A              Pod B
              10.244.1.5        10.244.2.7
                  │                  │
            ──────┼──────────────────┼──────  Cluster Network
                                              (CNI plugin: Calico/Flannel/Cilium)

Service Network (stable virtual IPs):
──────────────────────────────────────
Service IP: 10.96.43.22 (ClusterIP — virtual, doesn't actually exist on any interface)
     │
     ├── iptables/IPVS rules (managed by kube-proxy)
     │
     ├──► Pod A: 10.244.1.5  (30% traffic)
     ├──► Pod B: 10.244.2.7  (40% traffic)
     └──► Pod C: 10.244.3.2  (30% traffic)

DNS Resolution (CoreDNS):
──────────────────────────
my-service.my-namespace.svc.cluster.local
└── Resolves to Service ClusterIP
└── Within same namespace: just "my-service" works
```

---

## 6. Storage Architecture {#storage}

```
┌─────────────────────────────────────────────────────────┐
│                  STORAGE HIERARCHY                      │
│                                                         │
│  Developer creates:         Admin creates:              │
│                                                         │
│  PersistentVolumeClaim   ←→  PersistentVolume           │
│  (What I need)               (What's available)         │
│                                                         │
│  OR (dynamic):                                          │
│  PVC → StorageClass → Cloud Provider creates PV         │
│        (recipe for                                      │
│         creating storage)                               │
│                                                         │
│  PVC is bound to PV (1:1 binding)                       │
│  Pod references PVC in volumeMounts                     │
│                                                         │
│  Storage Types:                                         │
│  ├── emptyDir      (ephemeral, lost when pod dies)      │
│  ├── hostPath      (node's local filesystem)            │
│  ├── configMap     (mount ConfigMap as files)           │
│  ├── secret        (mount Secret as files)              │
│  ├── nfs           (NFS share)                          │
│  ├── awsElasticBlockStore (AWS EBS)                     │
│  ├── gcePersistentDisk    (GCP disk)                    │
│  └── csi           (any CSI-compatible driver)          │
└─────────────────────────────────────────────────────────┘
```
