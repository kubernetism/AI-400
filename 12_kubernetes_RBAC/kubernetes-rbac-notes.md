# 🔐 Kubernetes RBAC: Complete Study Notes
### From Zero to Production-Grade Security

> **Source References:** Official Kubernetes Documentation · Kubernetes For AI Services (Agent Factory) · kubernetes.io/docs/concepts/security/rbac-good-practices

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Section 1 — Foundations](#section-1--foundations-beginner)
   - [What is RBAC?](#1-what-is-rbac)
   - [Core RBAC Objects](#2-core-rbac-objects--the-four-building-blocks)
   - [Subjects — Who Gets Access?](#3-subjects--who-gets-access)
   - [Verbs and Resources](#4-verbs-and-resources)
3. [Section 2 — Intermediate Concepts](#section-2--intermediate-concepts)
   - [Namespaced vs Cluster-Wide RBAC](#5-namespaced-vs-cluster-wide-rbac)
   - [Built-in ClusterRoles](#6-built-in-clusterroles)
   - [ServiceAccount Deep Dive](#7-serviceaccount-deep-dive)
   - [ResourceNames — Restricting to Specific Objects](#8-resourcenames--restricting-to-specific-objects)
4. [Section 3 — Advanced Patterns](#section-3--advanced-patterns)
   - [Aggregated ClusterRoles](#9-aggregated-clusterroles)
   - [RBAC for Custom Resources (CRDs)](#10-rbac-for-custom-resources-crds)
   - [Impersonation](#11-impersonation)
   - [RBAC for Helm and CI/CD Pipelines](#12-rbac-for-helm-and-cicd-pipelines)
   - [Multi-Tenant RBAC Architecture](#13-multi-tenant-rbac-architecture)
   - [Privilege Escalation Prevention](#14-privilege-escalation-prevention)
5. [Section 4 — kubectl Command Reference](#section-4--kubectl-command-reference)
6. [Section 5 — Thinking Questions](#section-5--thinking-questions)
7. [Section 6 — Multiple Choice Questions (MCQs)](#section-6--multiple-choice-questions-mcqs)
8. [Section 7 — Hands-On Exercises](#section-7--hands-on-exercises)
9. [Section 8 — Quick Reference Card](#section-8--quick-reference-card)
10. [Further Reading](#further-reading)

---

## Prerequisites

Before studying Kubernetes RBAC, you should be comfortable with:

- **Kubernetes fundamentals**: Pods, Deployments, Services, Namespaces
- **kubectl basics**: `kubectl get`, `kubectl apply`, `kubectl describe`, `kubectl delete`
- **YAML syntax**: Correct indentation, key-value pairs, lists
- **Namespaces**: Understanding that namespaces provide virtual isolation within a cluster
- **Kubernetes API concepts**: Resources, API groups, and how the API server works

**Cluster requirement:** A running Kubernetes cluster (Docker Desktop, minikube, kind, or any cloud provider). All examples use `kubectl` CLI.

**Version note:** All examples use `apiVersion: rbac.authorization.k8s.io/v1` — the stable API since Kubernetes v1.8. The old `v1beta1` was **removed in Kubernetes 1.22** and will cause errors if used.

---

## 🔐 Section 1 — Foundations (Beginner)

---

### 1. What is RBAC?

**RBAC (Role-Based Access Control)** is Kubernetes' built-in authorization mechanism that controls *who* can do *what* to *which* resources in the cluster.

Without RBAC, every authenticated user or application could potentially read secrets, delete deployments, or take any action on any resource. RBAC solves this by enforcing the **principle of least privilege**: subjects (users, service accounts, groups) get only the permissions they explicitly need—nothing more.

#### Why RBAC Exists

In a real cluster, you have many actors:

- **Human users**: developers, operators, QA engineers, auditors
- **Applications/agents**: pods that need to call the Kubernetes API (e.g., to list ConfigMaps, watch Deployments)
- **CI/CD pipelines**: GitHub Actions, ArgoCD, Flux that deploy and manage workloads
- **Cluster system components**: kube-scheduler, kube-controller-manager, CoreDNS

Each of these needs a different level of access. A developer should be able to view pods in their namespace but not delete cluster nodes. An AI agent should read its own ConfigMap but not create new pods.

#### Brief History

| Version | Milestone |
|---------|-----------|
| Kubernetes 1.6 | RBAC introduced as alpha/beta |
| Kubernetes 1.8 | RBAC **graduated to stable** (GA) — default authorization mode |
| Kubernetes 1.22 | `rbac.authorization.k8s.io/v1beta1` removed; use `v1` only |

#### How RBAC Differs from Other Authorization Modes

| Mode | How It Works | Use Case |
|------|-------------|----------|
| **RBAC** | Role-based rules defined as Kubernetes objects | Standard, recommended for all clusters |
| **ABAC** (Attribute-Based) | Policy file on disk with JSON rules | Legacy, not dynamic, hard to manage |
| **Node** | Special-purpose for kubelets only | Automatic for node authorization |
| **Webhook** | External HTTP webhook decides authorization | Custom/complex enterprise policies |

Most production clusters use **RBAC + Node** authorization together. RBAC is enabled by passing `--authorization-mode=Node,RBAC` to the API server.

#### How the API Server Evaluates a Request

When a request arrives at the API server, it goes through three phases:

```
Request ──► Authentication ──► Authorization (RBAC) ──► Admission Control ──► etcd
              (Who are you?)     (Can you do this?)       (Is it valid?)      (Store it)
```

If **any** authorization check denies a request, Kubernetes returns HTTP 403 Forbidden. RBAC uses an **additive model**: permissions are denied by default, and rules only grant access — there is no concept of explicit "deny" rules in RBAC.

---

### 2. Core RBAC Objects — The Four Building Blocks

RBAC uses exactly four object types. Understanding the difference between each is essential.

```
┌──────────────────────────────────────────────────────────────────┐
│                    RBAC Object Relationships                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Role / ClusterRole          RoleBinding / ClusterRoleBinding   │
│   ┌─────────────────┐         ┌──────────────────────────────┐   │
│   │  PERMISSIONS    │ ◄──────►│  WHO gets WHAT permissions   │   │
│   │  (rules/verbs)  │         │  subjects → roleRef          │   │
│   └─────────────────┘         └──────────────────────────────┘   │
│          │                                    │                   │
│          │ defines                            │ binds             │
│          ▼                                    ▼                   │
│   "can get pods"               User / ServiceAccount / Group      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

#### 2a. Role — Namespaced Permissions

A **Role** defines a set of permissions **within a single namespace**. It answers: "What actions are allowed on which resources — but only within this namespace?"

**When to use:** When you want to grant access scoped to one specific namespace only.

```yaml
# role-pod-reader.yaml
apiVersion: rbac.authorization.k8s.io/v1   # Always use v1, never v1beta1
kind: Role                                   # Namespaced — only applies within metadata.namespace
metadata:
  name: pod-reader                           # Name of this Role
  namespace: fundtransfer                    # ONLY applies within this namespace
rules:
  - apiGroups: [""]                          # "" = core API group (pods, services, configmaps, secrets, etc.)
    resources: ["pods"]                      # Which resources this rule applies to
    verbs: ["get", "list", "watch"]          # Allowed actions: get=single item, list=all, watch=stream updates
  - apiGroups: ["apps"]                      # "apps" API group (deployments, replicasets, statefulsets, daemonsets)
    resources: ["deployments"]               # Deployments are in the "apps" group
    verbs: ["get", "list"]                   # Can view deployments but NOT create/update/delete
```

Apply and verify:
```bash
kubectl apply -f role-pod-reader.yaml
kubectl get role pod-reader -n fundtransfer
kubectl describe role pod-reader -n fundtransfer
```

---

#### 2b. ClusterRole — Cluster-Wide Permissions

A **ClusterRole** defines permissions that apply **across all namespaces**, or for **cluster-scoped resources** (like Nodes, PersistentVolumes, Namespaces) that don't belong to any namespace.

**When to use:**
- Access to cluster-scoped resources (nodes, clusterroles, persistentvolumes)
- Permissions that apply across ALL namespaces simultaneously
- Reusable permission sets (define once, bind in many namespaces via RoleBinding)

```yaml
# clusterrole-secret-reader.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole                            # Cluster-wide — NO namespace in metadata
metadata:
  name: secret-reader                        # No namespace field — this is cluster-scoped
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["nodes"]                     # Nodes are cluster-scoped — only ClusterRole can manage these
    verbs: ["get", "list"]
  - apiGroups: ["storage.k8s.io"]           # Non-core API groups use their full name
    resources: ["storageclasses"]
    verbs: ["get", "list"]
```

---

#### 2c. RoleBinding — Attach a Role to a Subject (in a Namespace)

A **RoleBinding** connects a Role (or ClusterRole) to a subject **within a specific namespace**.

**When to use:** To grant a user, group, or ServiceAccount the permissions defined in a Role or ClusterRole — but only in one namespace.

```yaml
# rolebinding-jane-pod-reader.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding                            # Namespaced binding
metadata:
  name: jane-pod-reader-binding              # Descriptive name: WHO-WHAT-binding
  namespace: fundtransfer                    # The namespace this binding applies to
roleRef:                                     # WHAT permissions to grant (immutable after creation!)
  apiGroup: rbac.authorization.k8s.io       # Always this value for RBAC
  kind: Role                                 # Can be "Role" or "ClusterRole"
  name: pod-reader                           # Must match an existing Role/ClusterRole name
subjects:                                    # WHO gets the permissions
  - kind: User                               # Can be User, Group, or ServiceAccount
    name: jane@example.com                   # The username (case-sensitive)
    apiGroup: rbac.authorization.k8s.io
```

**Important:** `roleRef` is **immutable** after creation. To change it, delete and recreate the binding.

---

#### 2d. ClusterRoleBinding — Attach a ClusterRole to a Subject (Cluster-Wide)

A **ClusterRoleBinding** connects a ClusterRole to a subject with **cluster-wide scope**. The subject gets permissions across ALL namespaces.

**When to use:** For cluster administrators, monitoring systems, or any workload needing access across all namespaces.

```yaml
# clusterrolebinding-admin.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding                     # Cluster-wide binding — no namespace
metadata:
  name: cluster-admin-binding               # Name this descriptively
  # NO namespace field — this applies cluster-wide
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole                          # Must reference a ClusterRole (not Role)
  name: cluster-admin                        # Built-in superuser ClusterRole
subjects:
  - kind: User
    name: admin@company.com
    apiGroup: rbac.authorization.k8s.io
  - kind: ServiceAccount                     # Multiple subjects allowed
    name: monitoring-sa
    namespace: monitoring                    # ServiceAccounts need their namespace specified
```

---

#### Summary Table: The Four RBAC Objects

| Object | Scope | References | Common Use Case |
|--------|-------|-----------|-----------------|
| `Role` | One namespace | — | Developer access within a namespace |
| `ClusterRole` | All namespaces + cluster resources | — | Admin access, cluster resource access |
| `RoleBinding` | One namespace | Role OR ClusterRole | Grant access scoped to one namespace |
| `ClusterRoleBinding` | Cluster-wide | ClusterRole ONLY | Grant access across entire cluster |

> 💡 **Key insight:** A `RoleBinding` can reference a `ClusterRole`. This is the "reuse pattern" — define a ClusterRole once with common permissions, then bind it per-namespace with RoleBindings.

---

### 3. Subjects — Who Gets Access?

The `subjects` field in a RoleBinding or ClusterRoleBinding specifies *who* receives the permissions. There are three types.

#### 3a. Users

Kubernetes has **no built-in User object**. Users are managed externally — through client certificates, OIDC tokens, webhook authenticators, etc. The API server trusts the username from the authentication mechanism (e.g., the CN field of an x509 certificate).

```yaml
subjects:
  - kind: User
    name: "jane@example.com"     # Exact string from authentication (e.g., cert CN or OIDC sub claim)
    apiGroup: rbac.authorization.k8s.io
```

```bash
# Grant a user view access to a specific namespace
kubectl create rolebinding jane-view \
  --clusterrole=view \
  --user=jane@example.com \
  --namespace=production
```

#### 3b. ServiceAccounts

**ServiceAccounts** are namespaced Kubernetes objects used by Pods to authenticate to the API server. Unlike Users, they DO have a corresponding Kubernetes object and are fully managed within the cluster.

```yaml
subjects:
  - kind: ServiceAccount
    name: my-service-account     # Name of the ServiceAccount object
    namespace: my-namespace      # REQUIRED for ServiceAccounts — specifies which namespace
```

The canonical reference format for a ServiceAccount is:
`system:serviceaccount:<namespace>:<name>`

```bash
# Check what permissions a ServiceAccount has
kubectl auth can-i get pods \
  --as=system:serviceaccount:default:my-sa \
  -n default
```

Full example — creating a ServiceAccount and binding a role to it:

```yaml
# serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: agent-sa
  namespace: fundtransfer

---
# rolebinding-sa.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: agent-sa-reader
  namespace: fundtransfer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-reader
subjects:
  - kind: ServiceAccount
    name: agent-sa
    namespace: fundtransfer    # Must match the ServiceAccount's actual namespace
```

#### 3c. Groups

Groups allow granting permissions to a set of users or ServiceAccounts at once. Like Users, groups come from the external authentication system. Kubernetes has several built-in groups:

| Group | Members |
|-------|---------|
| `system:authenticated` | All successfully authenticated users |
| `system:unauthenticated` | Requests with no valid credentials |
| `system:masters` | Bypasses ALL RBAC checks — unrestricted superuser ⚠️ |
| `system:nodes` | All kubelets |
| `system:serviceaccounts` | All ServiceAccounts in the cluster |
| `system:serviceaccounts:<namespace>` | All ServiceAccounts in a specific namespace |

```yaml
# Grant all authenticated users view access to a namespace
subjects:
  - kind: Group
    name: "system:authenticated"
    apiGroup: rbac.authorization.k8s.io

# Grant all ServiceAccounts in 'dev' namespace read-only pod access
subjects:
  - kind: Group
    name: "system:serviceaccounts:dev"
    apiGroup: rbac.authorization.k8s.io
```

> ⚠️ **Warning:** Adding users to `system:masters` bypasses ALL RBAC checks permanently and cannot be restricted by removing RoleBindings or ClusterRoleBindings. Avoid this group entirely in production.

---

### 4. Verbs and Resources

RBAC rules consist of three components: **apiGroups**, **resources**, and **verbs**. Together they form a complete permission: "On these API groups, on these resources, allow these actions."

#### 4a. Complete Verb Reference

| Verb | HTTP Method | Description | Use Case |
|------|-------------|-------------|----------|
| `get` | GET | Retrieve a single specific resource by name | Read one pod: `kubectl get pod mypod` |
| `list` | GET (collection) | Retrieve all resources of a type | List all pods: `kubectl get pods` |
| `watch` | GET (streaming) | Stream real-time updates to resources | `kubectl get pods --watch` |
| `create` | POST | Create a new resource | `kubectl apply -f pod.yaml` (new) |
| `update` | PUT | Replace an entire resource | Full update of a resource |
| `patch` | PATCH | Partially modify a resource | `kubectl patch deployment ...` |
| `delete` | DELETE | Delete a single resource | `kubectl delete pod mypod` |
| `deletecollection` | DELETE (collection) | Delete all resources of a type | `kubectl delete pods --all` |
| `exec` | POST (subresource) | Execute command in container | `kubectl exec` |
| `portforward` | POST (subresource) | Forward local port to pod | `kubectl port-forward` |

> 🔍 **Critical:** `list` and `watch` on Secrets effectively expose secret contents! A `List` response includes the full data of all secrets. Treat `list secrets` as equally sensitive as `get secrets`.

#### 4b. Common API Groups

API groups organize Kubernetes resources. The `apiGroups` field in a Role rule must match the group of the resource you're targeting:

| API Group | Resources | Example |
|-----------|-----------|---------|
| `""` (empty string) | pods, services, endpoints, configmaps, secrets, nodes, namespaces, serviceaccounts, persistentvolumeclaims | Core objects |
| `apps` | deployments, replicasets, statefulsets, daemonsets | Workload controllers |
| `batch` | jobs, cronjobs | Batch workloads |
| `rbac.authorization.k8s.io` | roles, rolebindings, clusterroles, clusterrolebindings | RBAC objects themselves |
| `autoscaling` | horizontalpodautoscalers | HPA |
| `networking.k8s.io` | ingresses, networkpolicies | Networking |
| `storage.k8s.io` | storageclasses, persistentvolumes | Storage |
| `apiextensions.k8s.io` | customresourcedefinitions | CRDs |

```bash
# Discover which API group a resource belongs to
kubectl api-resources --sort-by=name | grep deployment
# Output: deployments   deploy  apps/v1   true  Deployment
#                                ^^^^  <-- this is the apiGroup: "apps"
```

#### 4c. Resources vs Subresources

Some Kubernetes resources have subresources — additional endpoints that control specific operations. Subresources must be listed separately in RBAC rules:

| Resource | Subresource | What It Controls |
|----------|-------------|-----------------|
| `pods` | `pods/log` | `kubectl logs <pod>` |
| `pods` | `pods/exec` | `kubectl exec -it <pod>` |
| `pods` | `pods/portforward` | `kubectl port-forward` |
| `pods` | `pods/status` | Updating pod status |
| `nodes` | `nodes/proxy` | Kubelet API — full node access ⚠️ |
| `deployments` | `deployments/scale` | `kubectl scale deployment` |

```yaml
# Grant pod viewing AND log access — note subresource syntax
rules:
  - apiGroups: [""]
    resources: ["pods"]          # Access to the pods resource itself
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/log"]      # SEPARATE rule for the subresource
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["pods/exec"]     # exec is also a subresource
    verbs: ["create"]            # exec uses "create" verb, not "exec"
```

> ⚠️ **Security warning:** `nodes/proxy` gives access to the Kubelet API, which allows command execution on every pod on that node. This **bypasses audit logging and admission control**. Grant with extreme caution.

#### 4d. Wildcard Usage

Wildcards (`*`) can match all resources or all verbs:

```yaml
# DANGEROUS — grants all verbs on all resources in all API groups
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]

# More targeted wildcard — all verbs on configmaps in core group
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["*"]
```

> ⚠️ **Avoid wildcards in production.** As Kubernetes adds new resources and API groups, a wildcard rule automatically grants access to those future resources too — including ones that don't exist yet. Enumerate permissions explicitly.

---

## ⚙️ Section 2 — Intermediate Concepts

---

### 5. Namespaced vs Cluster-Wide RBAC

Choosing the right scope is one of the most common RBAC decisions. Use this decision guide:

```
Does the subject need access to cluster-scoped resources?
(nodes, persistentvolumes, namespaces, clusterroles)
       │
       ├── YES ──► ClusterRole + ClusterRoleBinding
       │
       └── NO
            │
            Does the subject need access across ALL namespaces?
                   │
                   ├── YES ──► ClusterRole + ClusterRoleBinding
                   │
                   └── NO
                        │
                        Is the same permission set needed in multiple namespaces?
                               │
                               ├── YES ──► ClusterRole + RoleBinding (per namespace)
                               │            (define once, reuse many times)
                               │
                               └── NO ──► Role + RoleBinding (in one namespace)
```

#### The Power Pattern: ClusterRole + RoleBinding

You can bind a `ClusterRole` using a `RoleBinding` — this limits the scope to only that namespace, while reusing the role definition across multiple namespaces.

```yaml
# Define the ClusterRole ONCE (reusable template)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: developer-role          # Reusable across namespaces
rules:
  - apiGroups: ["", "apps"]
    resources: ["pods", "deployments", "services", "configmaps"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]

---
# Bind it in namespace "team-a" — only applies there
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-developer
  namespace: team-a             # Scope is LIMITED to this namespace only
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole             # References a ClusterRole
  name: developer-role
subjects:
  - kind: User
    name: alice@company.com
    apiGroup: rbac.authorization.k8s.io

---
# Same ClusterRole, different namespace — alice has NO access here
# But bob does:
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-b-developer
  namespace: team-b
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: developer-role
subjects:
  - kind: User
    name: bob@company.com
    apiGroup: rbac.authorization.k8s.io
```

#### Real-World Scenario Comparison

| Scenario | Binding Type | Why |
|----------|-------------|-----|
| Developer needs to deploy in `staging` only | RoleBinding (referencing ClusterRole) | Scoped to one namespace |
| SRE needs to view pods in all namespaces | ClusterRoleBinding to `view` | Needs cross-namespace access |
| AI agent needs to read its own ConfigMap | RoleBinding to namespaced Role | Strictly namespaced |
| Prometheus needs to scrape all namespaces | ClusterRoleBinding | Cross-namespace metrics gathering |
| ArgoCD deploying to specific namespaces | RoleBinding per namespace | Controlled blast radius |
| Cluster operator managing nodes | ClusterRoleBinding | Nodes are cluster-scoped |

---

### 6. Built-in ClusterRoles

Kubernetes ships with several built-in ClusterRoles. Understanding them prevents accidentally over- or under-granting permissions.

#### The Four User-Facing ClusterRoles

| ClusterRole | Can Read | Can Write | Can Delete | Can Manage RBAC | Use Case |
|-------------|----------|-----------|------------|-----------------|----------|
| `view` | ✅ most resources | ❌ | ❌ | ❌ | Read-only access for auditors/developers |
| `edit` | ✅ | ✅ | ✅ | ❌ | Developer with full workload access |
| `admin` | ✅ | ✅ | ✅ | ✅ (namespace-scoped) | Namespace admin |
| `cluster-admin` | ✅ everything | ✅ everything | ✅ everything | ✅ everything | Full cluster superuser |

> ⚠️ **The `cluster-admin` role gives unrestricted access to the entire cluster.** Use it only for actual cluster administrators, not for applications or regular developers.

```bash
# Inspect built-in roles
kubectl describe clusterrole view
kubectl describe clusterrole edit
kubectl describe clusterrole admin
kubectl describe clusterrole cluster-admin

# See what resources 'view' can access
kubectl get clusterrole view -o yaml
```

#### Built-in System Roles

These are used internally by Kubernetes components and should not be modified:

| System ClusterRole | Used By | Purpose |
|-------------------|---------|---------|
| `system:kube-scheduler` | kube-scheduler | Schedule pods to nodes |
| `system:kube-controller-manager` | kube-controller-manager | Reconcile cluster state |
| `system:node` | kubelet on each node | Manage pods and node resources |
| `system:coredns` | CoreDNS pods | DNS resolution across cluster |
| `system:discovery` | All authenticated users | Discover API endpoints |
| `system:public-info-viewer` | All users | View cluster version info |

```bash
# List all system ClusterRoles
kubectl get clusterroles | grep "^system:"

# See who has cluster-admin (dangerous — check this regularly!)
kubectl get clusterrolebindings -o wide | grep cluster-admin
```

---

### 7. ServiceAccount Deep Dive

ServiceAccounts are the primary identity mechanism for applications running inside Kubernetes. Every pod runs as a ServiceAccount.

#### Default ServiceAccount Behavior

Every namespace automatically gets a `default` ServiceAccount. If you create a Pod without specifying a `serviceAccountName`, it uses this default SA. By default, the default SA has **no permissions** but its token is still mounted into pods.

```bash
# Inspect the default ServiceAccount
kubectl get serviceaccount default -o yaml -n default

# See all ServiceAccounts in a namespace
kubectl get serviceaccounts -n fundtransfer
```

#### Creating Dedicated ServiceAccounts

Always create dedicated ServiceAccounts for each distinct workload — never share SAs between applications:

```yaml
# Dedicated SA for an AI agent workload
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ai-agent-sa
  namespace: ai-workloads
  annotations:
    # Document what this SA is for (best practice)
    description: "ServiceAccount for the order-processing AI agent"
    team: "ai-platform"
```

```bash
# Imperative creation
kubectl create serviceaccount ai-agent-sa -n ai-workloads

# Create a token for testing (Kubernetes 1.24+)
kubectl create token ai-agent-sa -n ai-workloads

# Create a long-lived token (not recommended — use projected volumes instead)
kubectl create secret serviceaccount-token my-sa-token \
  --serviceaccount=ai-agent-sa \
  -n ai-workloads
```

#### Disabling Auto-Mount of the Service Account Token

By default, Kubernetes automatically mounts the ServiceAccount token into every pod at `/var/run/secrets/kubernetes.io/serviceaccount/token`. If your pod doesn't need to call the Kubernetes API, disable this:

```yaml
# At ServiceAccount level — affects ALL pods using this SA
apiVersion: v1
kind: ServiceAccount
metadata:
  name: no-api-access-sa
  namespace: default
automountServiceAccountToken: false    # Disable automatic token mounting

---
# At Pod level — overrides the SA-level setting
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  serviceAccountName: no-api-access-sa
  automountServiceAccountToken: false   # Pod-level override
  containers:
    - name: app
      image: nginx
```

#### Using a ServiceAccount in a Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: agent-pod
  namespace: fundtransfer
spec:
  serviceAccountName: agent-sa         # Use a dedicated SA — NEVER use default for apps
  automountServiceAccountToken: true   # Explicitly enabled (default is true)
  containers:
    - name: agent
      image: my-ai-agent:v1.0
      env:
        - name: KUBERNETES_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
```

#### Bound Service Account Tokens (Kubernetes 1.20+)

Modern Kubernetes uses projected volumes with time-bound, audience-bound tokens instead of static secrets:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  serviceAccountName: agent-sa
  containers:
    - name: app
      image: my-app
      volumeMounts:
        - mountPath: /var/run/secrets/tokens
          name: app-token
  volumes:
    - name: app-token
      projected:
        sources:
          - serviceAccountToken:
              audience: my-app          # Audience claim in the token
              expirationSeconds: 3600   # Token expires in 1 hour (auto-refreshed)
              path: token               # Mounted at /var/run/secrets/tokens/token
```

---

### 8. ResourceNames — Restricting to Specific Objects

The `resourceNames` field in a Role rule limits access to **specific named instances** of a resource, not all resources of that type.

#### What ResourceNames Does

Without `resourceNames`, a rule grants access to ALL objects of that resource type. With `resourceNames`, access is restricted to only those specific objects:

```yaml
# WITHOUT resourceNames — can get ANY secret in the namespace
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]

# WITH resourceNames — can ONLY get these two specific secrets
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list"]
    resourceNames: ["api-credentials", "db-password"]  # Only these secrets
```

#### Practical Example: AI Agent with Pinned Resources

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: agent-pinned-reader
  namespace: fundtransfer
rules:
  # Only access to these specific ConfigMaps
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get"]
    resourceNames: ["agent-config", "feature-flags"]

  # Only access to these specific Secrets
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
    resourceNames: ["api-key", "db-credentials"]
```

#### Limitations of resourceNames

`resourceNames` does **not** work with the `list` or `watch` verbs on most resources, because `list` doesn't target a specific named resource — it retrieves all resources. If you need to list and restrict, use separate roles or namespace separation.

```bash
# Verify restricted access
kubectl auth can-i get secret api-key \
  --as=system:serviceaccount:fundtransfer:agent-sa \
  -n fundtransfer
# Output: yes

kubectl auth can-i get secret some-other-secret \
  --as=system:serviceaccount:fundtransfer:agent-sa \
  -n fundtransfer
# Output: no
```

---

## 🛡️ Section 3 — Advanced Patterns

---

### 9. Aggregated ClusterRoles

**Aggregated ClusterRoles** are a powerful pattern that allows you to build composite roles from smaller roles using label selectors. When you add a new ClusterRole with matching labels, it's automatically incorporated into the aggregate — no manual updates needed.

#### How Aggregation Works

The aggregate ClusterRole has an `aggregationRule` instead of `rules`. Kubernetes automatically combines all ClusterRoles matching the label selector into this role:

```yaml
# The aggregated role — it has NO rules itself, they're pulled from labeled roles
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-full
aggregationRule:
  clusterRoleSelectors:
    - matchLabels:
        rbac.example.com/aggregate-to-monitoring: "true"   # Selector for aggregation
rules: []   # Empty — automatically populated from matching ClusterRoles
```

```yaml
# Component role 1 — labeled for aggregation
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-pods
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"   # This triggers aggregation
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]

---
# Component role 2 — also labeled for aggregation
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-metrics
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"
rules:
  - apiGroups: ["metrics.k8s.io"]
    resources: ["pods", "nodes"]
    verbs: ["get", "list"]
```

Now `monitoring-full` automatically includes rules from both `monitoring-pods` and `monitoring-metrics`. When you later create `monitoring-services` with the same label, it's automatically included.

#### Extending Built-In Roles for CRDs

The most common use of aggregation is extending built-in roles (`view`, `edit`, `admin`) to include your Custom Resources:

```yaml
# Add CRD access to the built-in 'view' ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: myapp-crd-viewer
  labels:
    # This magic label aggregates INTO the built-in 'view' ClusterRole
    rbac.authorization.k8s.io/aggregate-to-view: "true"
    rbac.authorization.k8s.io/aggregate-to-edit: "true"    # Also add to edit
    rbac.authorization.k8s.io/aggregate-to-admin: "true"   # Also add to admin
rules:
  - apiGroups: ["myapp.io"]
    resources: ["widgets", "gadgets"]
    verbs: ["get", "list", "watch"]
```

After applying this, anyone with the `view` ClusterRole can automatically view your CRD resources — without modifying the built-in role.

```bash
# Verify aggregation worked
kubectl get clusterrole view -o yaml | grep -A5 "myapp"
```

---

### 10. RBAC for Custom Resources (CRDs)

When you install Custom Resource Definitions (CRDs), Kubernetes does **not** automatically grant access to them. You must create explicit RBAC rules.

#### Why CRDs Need Explicit RBAC

CRDs register new resource types in the API server. Without RBAC rules, even cluster-admin users in a namespace won't have access to new CRs via standard roles. Every CRD introduces its own API group, resource name, and potentially subresources.

```yaml
# CRD definition (what the operator registers)
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: certificates.cert-manager.io
spec:
  group: cert-manager.io             # <-- This becomes the apiGroup in RBAC rules
  names:
    plural: certificates
    singular: certificate
    kind: Certificate
  scope: Namespaced
```

```yaml
# RBAC for this CRD — reference the CRD's group and resource
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cert-manager-user
rules:
  - apiGroups: ["cert-manager.io"]   # Must match the CRD's spec.group
    resources: ["certificates", "certificaterequests", "issuers"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["cert-manager.io"]
    resources: ["certificates/status"]   # Subresources of CRDs also need explicit rules
    verbs: ["get", "patch", "update"]
```

```yaml
# Real-world example: ArgoCD ClusterRole for managing application CRs
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: argocd-application-manager
rules:
  - apiGroups: ["argoproj.io"]      # ArgoCD's CRD group
    resources: ["applications", "appprojects"]
    verbs: ["create", "get", "list", "watch", "update", "patch", "delete"]
  - apiGroups: [""]
    resources: ["secrets", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets"]
    verbs: ["get", "list", "watch"]
```

---

### 11. Impersonation

Impersonation lets an authenticated user make API calls *as if they were another user, group, or ServiceAccount*. This is the mechanism behind `kubectl --as=` and `kubectl --as-group=`.

#### Using Impersonation with kubectl

```bash
# Act as a specific user
kubectl get pods --as=jane@example.com -n production

# Act as a specific ServiceAccount
kubectl get secrets \
  --as=system:serviceaccount:default:agent-sa \
  -n default

# Act as a user AND simulate group memberships
kubectl auth can-i list pods \
  --as=jane@example.com \
  --as-group=dev-team \
  --as-group=system:authenticated \
  -n staging
```

#### RBAC Rule for Granting Impersonation Rights

The `impersonate` verb is special — it controls who can impersonate whom:

```yaml
# Allow 'helpdesk' users to impersonate 'junior-devs' group
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: helpdesk-impersonator
rules:
  - apiGroups: [""]
    resources: ["users"]           # Resource type: users, groups, or serviceaccounts
    verbs: ["impersonate"]
    resourceNames: ["junior-dev1", "junior-dev2"]  # Only these users

  - apiGroups: [""]
    resources: ["groups"]          # Can impersonate this group
    verbs: ["impersonate"]
    resourceNames: ["junior-devs"]

  - apiGroups: ["authentication.k8s.io"]
    resources: ["userextras/scopes"]   # Extra user info
    verbs: ["impersonate"]
```

```yaml
# Bind the impersonator role
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: helpdesk-can-impersonate
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: helpdesk-impersonator
subjects:
  - kind: Group
    name: helpdesk-team
    apiGroup: rbac.authorization.k8s.io
```

> ⚠️ **Security implication:** Impersonation allows bypassing your own permissions. If someone can impersonate `cluster-admin`, they effectively have cluster-admin access. Always combine impersonation with `resourceNames` to limit *which* identities can be impersonated. Impersonation is fully logged in audit logs.

---

### 12. RBAC for Helm and CI/CD Pipelines

#### Minimal Helm ServiceAccount

Helm needs specific permissions to deploy applications. Avoid using `cluster-admin`:

```yaml
# Helm deployer ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: helm-deployer
  namespace: production

---
# Role: what Helm actually needs in one namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: helm-deploy-role
  namespace: production
rules:
  - apiGroups: ["", "apps", "batch", "networking.k8s.io", "autoscaling"]
    resources:
      - deployments
      - replicasets
      - pods
      - services
      - configmaps
      - secrets
      - ingresses
      - jobs
      - horizontalpodautoscalers
      - serviceaccounts
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  # Helm needs to create/manage RoleBindings for charts that include RBAC
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["roles", "rolebindings"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: helm-deployer-binding
  namespace: production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: helm-deploy-role
subjects:
  - kind: ServiceAccount
    name: helm-deployer
    namespace: production
```

#### ArgoCD ServiceAccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: argocd-sa
  namespace: argocd

---
# ArgoCD needs read access cluster-wide to sync resources
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: argocd-cluster-role
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps", ""]
    resources: ["deployments", "services", "configmaps", "secrets"]
    verbs: ["create", "update", "patch", "delete"]
  - apiGroups: ["argoproj.io"]
    resources: ["applications", "appprojects"]
    verbs: ["*"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: argocd-cluster-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: argocd-cluster-role
subjects:
  - kind: ServiceAccount
    name: argocd-sa
    namespace: argocd
```

#### GitHub Actions CI/CD Pipeline

```yaml
# Minimal SA for a GitHub Actions runner deploying to staging
apiVersion: v1
kind: ServiceAccount
metadata:
  name: github-actions-deployer
  namespace: staging

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ci-deployer
  namespace: staging
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "update", "patch"]   # Only update images, not create/delete
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get"]
```

---

### 13. Multi-Tenant RBAC Architecture

Multi-tenancy in Kubernetes means multiple teams or customers share a single cluster with strong isolation.

#### Namespace-Per-Team Model

```
Cluster
├── namespace: team-alpha
│   ├── ServiceAccount: alpha-agent-sa
│   ├── Role: alpha-developer
│   ├── RoleBinding: alpha-dev-binding
│   └── (alpha workloads)
├── namespace: team-beta
│   ├── ServiceAccount: beta-agent-sa
│   ├── Role: beta-developer
│   ├── RoleBinding: beta-dev-binding
│   └── (beta workloads)
└── namespace: shared-infra
    └── (shared databases, monitoring)
```

#### Full Multi-Tenant RBAC Setup

```yaml
# Team Alpha namespace and RBAC
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
  labels:
    team: alpha
    pod-security.kubernetes.io/enforce: baseline   # Pod Security Admission

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: alpha-agent-sa
  namespace: team-alpha

---
# Shared ClusterRole (reused by both teams via RoleBinding)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: team-developer
rules:
  - apiGroups: ["", "apps", "batch"]
    resources: ["pods", "deployments", "services", "configmaps", "jobs"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods/log", "pods/exec"]
    verbs: ["get", "create"]
  # Teams cannot manage their own RBAC (prevents privilege escalation)
  # Teams cannot create Secrets (use external secrets operator instead)

---
# Bind ClusterRole to team-alpha namespace only
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: alpha-developer-binding
  namespace: team-alpha
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: team-developer
subjects:
  - kind: Group
    name: team-alpha-developers
    apiGroup: rbac.authorization.k8s.io
  - kind: ServiceAccount
    name: alpha-agent-sa
    namespace: team-alpha

---
# Identical setup for team-beta in their namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: beta-developer-binding
  namespace: team-beta
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: team-developer           # Same ClusterRole — but different namespace binding
subjects:
  - kind: Group
    name: team-beta-developers
    apiGroup: rbac.authorization.k8s.io
```

#### Preventing Cross-Tenant Access

Key rules for isolation:

1. **Never** give a ServiceAccount in `team-alpha` a ClusterRoleBinding — it would cross namespace boundaries
2. **Never** give teams the `escalate`, `bind`, or `impersonate` verbs
3. **Never** allow teams to manage their own RoleBindings (they could grant themselves cluster-admin)
4. Use **NetworkPolicies** to restrict east-west traffic between namespaces
5. Use **ResourceQuotas** per namespace to prevent DoS attacks
6. Use **Pod Security Standards** (Baseline/Restricted) to prevent privilege escalation through pods

---

### 14. Privilege Escalation Prevention

Kubernetes has built-in protections against privilege escalation through RBAC. Understanding these is critical for secure cluster design.

#### The Core Rule: You Cannot Grant What You Don't Have

The API server enforces this: **a user cannot create or update a Role or RoleBinding that grants more permissions than they currently possess**. This prevents "bootstrapping" your way to superuser.

```bash
# This will FAIL if alice doesn't have cluster-admin herself
kubectl create clusterrolebinding make-me-admin \
  --clusterrole=cluster-admin \
  --user=alice   # Error: forbidden (alice can't grant permissions she doesn't have)
```

#### The `escalate` Verb

The `escalate` verb is an exception to the above rule — it allows a user to create Roles/ClusterRoles with MORE permissions than they have:

```yaml
# Granting escalate — use with extreme caution
rules:
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["clusterroles"]
    verbs: ["escalate"]    # Allows creating roles with higher privileges than self
```

> ⚠️ **Granting `escalate` is equivalent to granting cluster-admin access.** Anyone with `escalate` can create a role with any permissions and bind it to themselves.

#### The `bind` Verb

The `bind` verb allows a user to create RoleBindings/ClusterRoleBindings to roles they don't possess:

```yaml
rules:
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["clusterrolebindings"]
    verbs: ["bind"]              # Allows binding to roles user doesn't have
    resourceNames: ["edit"]      # Limit to specific roles for safety
```

#### The `impersonate` Verb

As covered earlier, `impersonate` lets a user act as another identity. If a user can impersonate cluster-admin, they effectively have that access.

#### Dangerous Privilege Escalation Paths

Be aware of these indirect escalation vectors (as documented in official Kubernetes security guidance):

| Permission | Why It's Dangerous |
|------------|-------------------|
| `create pods` | Can mount any secret as a volume, run as any ServiceAccount |
| `create persistentvolumes` | Can mount hostPath volumes to read node filesystem |
| `patch/update namespaces` | Can change Pod Security Admission labels to allow privileged pods |
| `create certificatesigningrequests/approval` | Can create new user certificates with arbitrary identities |
| `create serviceaccounts/token` | Can create tokens for any ServiceAccount |
| `get/list secrets` | Exposes all secret values (list returns full secret data) |
| `access nodes/proxy` | Bypasses audit logging, executes on any pod via Kubelet API |
| `control webhooks` | Can read or mutate any API object admitted to the cluster |

---

## 💻 Section 4 — kubectl Command Reference

---

### Complete kubectl RBAC Cheatsheet

#### 🔍 Discovery & Inspection

```bash
# List all roles in a specific namespace
kubectl get roles -n fundtransfer

# List all roles across all namespaces
kubectl get roles -A

# List all ClusterRoles
kubectl get clusterroles

# List all ClusterRoles (exclude system ones)
kubectl get clusterroles | grep -v "^system:"

# Describe a Role — see its rules in human-readable form
kubectl describe role pod-reader -n fundtransfer

# Describe a ClusterRole
kubectl describe clusterrole cluster-admin

# Get Role as YAML (useful for copying/editing)
kubectl get role pod-reader -n fundtransfer -o yaml

# List all RoleBindings in a namespace
kubectl get rolebindings -n fundtransfer

# List all RoleBindings across all namespaces
kubectl get rolebindings -A

# List all ClusterRoleBindings
kubectl get clusterrolebindings

# Describe a RoleBinding — shows subjects and roleRef
kubectl describe rolebinding agent-reader-binding -n fundtransfer

# Show all resources in wide format (shows roleRef and subjects)
kubectl get rolebindings -n default -o wide

# Who has cluster-admin? (audit this regularly)
kubectl get clusterrolebindings -o wide | grep cluster-admin
```

#### ✅ Permission Checking with `kubectl auth can-i`

```bash
# Basic: can current user do X?
kubectl auth can-i get pods
kubectl auth can-i create deployments -n production

# Check for a DIFFERENT user
kubectl auth can-i list secrets --as=jane@example.com -n production

# Check for a ServiceAccount (use full format)
kubectl auth can-i get configmaps \
  --as=system:serviceaccount:fundtransfer:agent-sa \
  -n fundtransfer

# Check for a specific named resource
kubectl auth can-i get secret api-key \
  --as=system:serviceaccount:default:agent-sa \
  -n default

# List ALL permissions for current user in a namespace
kubectl auth can-i --list -n fundtransfer

# List ALL permissions for a specific user in a namespace
kubectl auth can-i --list --as=jane@example.com -n production

# List ALL permissions for a ServiceAccount cluster-wide
kubectl auth can-i --list \
  --as=system:serviceaccount:monitoring:prometheus-sa

# Check subresource access
kubectl auth can-i create pods/exec \
  --as=system:serviceaccount:default:agent-sa \
  -n default

# Check who you are (current context identity)
kubectl auth whoami
```

#### 🏗️ Creation Commands (Imperative)

```bash
# Create a ServiceAccount
kubectl create serviceaccount agent-sa -n fundtransfer

# Create a Role imperatively
kubectl create role pod-reader \
  --verb=get,list,watch \
  --resource=pods \
  -n fundtransfer

# Create a Role with multiple resource types
kubectl create role app-deployer \
  --verb=get,list,watch,create,update,patch \
  --resource=deployments,pods,services,configmaps \
  -n production

# Create a ClusterRole
kubectl create clusterrole cluster-node-reader \
  --verb=get,list,watch \
  --resource=nodes

# Create a RoleBinding for a User
kubectl create rolebinding jane-pod-reader \
  --role=pod-reader \
  --user=jane@example.com \
  -n fundtransfer

# Create a RoleBinding for a ServiceAccount
kubectl create rolebinding agent-reader \
  --role=pod-reader \
  --serviceaccount=fundtransfer:agent-sa \
  -n fundtransfer

# Create a RoleBinding referencing a ClusterRole
kubectl create rolebinding dev-binding \
  --clusterrole=edit \
  --user=developer@company.com \
  -n staging

# Create a ClusterRoleBinding
kubectl create clusterrolebinding admin-binding \
  --clusterrole=cluster-admin \
  --user=admin@company.com

# Create a ClusterRoleBinding for a ServiceAccount
kubectl create clusterrolebinding prometheus-viewer \
  --clusterrole=view \
  --serviceaccount=monitoring:prometheus-sa

# Generate a token for a ServiceAccount (Kubernetes 1.24+)
kubectl create token agent-sa -n fundtransfer

# Generate a token with custom expiry
kubectl create token agent-sa -n fundtransfer --duration=24h
```

#### 🔧 Editing & Reconciliation

```bash
# Edit a Role in-place
kubectl edit role pod-reader -n fundtransfer

# Apply RBAC from file (idempotent — safe to run multiple times)
kubectl apply -f rbac-rules.yaml

# Dry-run to preview changes without applying
kubectl apply -f rbac-rules.yaml --dry-run=client

# Server-side dry-run (more accurate validation)
kubectl apply -f rbac-rules.yaml --dry-run=server

# Reconcile RBAC from manifests (applies and reports changes)
kubectl auth reconcile -f rbac-rules.yaml

# Reconcile and show what changed
kubectl auth reconcile -f rbac-rules.yaml --dry-run

# Delete a RoleBinding
kubectl delete rolebinding agent-reader -n fundtransfer

# Delete a Role (bindings referencing it become broken)
kubectl delete role pod-reader -n fundtransfer
```

#### 🔎 Audit & Debugging

```bash
# Find all subjects bound to a specific ClusterRole
kubectl get clusterrolebindings -o json | \
  jq '.items[] | select(.roleRef.name=="cluster-admin") | .subjects'

# Find all RoleBindings that reference a specific ServiceAccount
kubectl get rolebindings,clusterrolebindings -A -o json | \
  jq '.items[] | select(.subjects[]?.name=="agent-sa")'

# Check if a ServiceAccount exists
kubectl get serviceaccount agent-sa -n fundtransfer

# Show all ServiceAccounts in a namespace
kubectl get serviceaccounts -n fundtransfer

# See the automount token setting
kubectl get serviceaccount default -o jsonpath='{.automountServiceAccountToken}'

# Find all RoleBindings in a namespace and their subjects
kubectl get rolebindings -n production -o custom-columns=\
  "NAME:.metadata.name,ROLE:.roleRef.name,SUBJECTS:.subjects[*].name"

# Verify a Deployment uses the correct ServiceAccount
kubectl get deployment my-app -n production \
  -o jsonpath='{.spec.template.spec.serviceAccountName}'

# Check events for RBAC errors (403 Forbidden)
kubectl get events -n fundtransfer | grep -i "forbidden\|rbac\|unauthorized"
```

---

## 🤔 Section 5 — Thinking Questions

*These questions are designed to build deep understanding, not just recall. Think through each one before reading the hint.*

---

### Conceptual Understanding

**Q1: Why does Kubernetes not have a built-in User object, while it does have ServiceAccount objects?**
> 💡 *Hint: Think about who manages users vs. who manages service accounts — and where the identity information comes from in each case.*

**Q2: RBAC uses an additive model — permissions can only be granted, never explicitly denied. What are the security implications of this design choice, and when could it become a problem?**
> 💡 *Hint: Consider a scenario where a user is in multiple groups, each with different RoleBindings, and you want to restrict access for just one scenario.*

**Q3: Why is `list` on Secrets considered as sensitive as `get` on Secrets, even though `list` doesn't let you specify a resource name?**
> 💡 *Hint: Think about what the API server returns in a list response — does it return just metadata, or full resource contents?*

**Q4: A ClusterRole has no namespace, but a RoleBinding that references a ClusterRole DOES have a namespace. How does this work, and what scope does the resulting permission have?**
> 💡 *Hint: Think about what the RoleBinding's namespace controls vs. what the ClusterRole's rules define.*

**Q5: Why does Kubernetes enforce that you cannot grant permissions you don't already possess when creating Roles/RoleBindings? What attack would this prevent?**
> 💡 *Hint: Imagine a user with only `get pods` permission who could freely create Roles and RoleBindings — what could they do?*

---

### Scenario-Based

**Q6: Your AI agent pod needs to read a specific ConfigMap in its own namespace. What is the MINIMAL complete RBAC configuration (SA, Role, RoleBinding, and Pod spec) you would create?**
> 💡 *Hint: Think about resourceNames to further restrict which specific ConfigMap is accessible.*

**Q7: A monitoring tool needs to scrape metrics from pods in ALL namespaces. What combination of RBAC objects would you use, and why is ClusterRoleBinding necessary here instead of multiple RoleBindings?**
> 💡 *Hint: Consider how many namespaces exist now vs. in the future, and what happens when a new namespace is created.*

**Q8: You have 10 teams each in their own namespace. All teams need identical developer permissions (deploy/scale/view). How would you structure RBAC to avoid creating 10 identical Roles?**
> 💡 *Hint: One ClusterRole + 10 RoleBindings is better than 10 identical Roles. What's the pattern called?*

**Q9: Your CI/CD pipeline runs in a `ci` namespace and needs to update Deployments in `production`, `staging`, and `dev` namespaces. How would you set this up without giving the pipeline cluster-admin?**
> 💡 *Hint: A ClusterRoleBinding would be too broad. What about a Role in each target namespace with a binding?*

**Q10: A developer complains they can't scale a Deployment despite having the `edit` ClusterRole in their namespace. What might be the problem?**
> 💡 *Hint: `kubectl scale` uses the `deployments/scale` subresource — does `edit` include it? Also consider which namespace the binding is in.*

---

### Debugging / Troubleshooting

**Q11: A developer says they can't exec into pods even though they have a Role with `pods: [get, list, watch]`. Why does `kubectl exec` fail?**
> 💡 *Hint: `kubectl exec` uses a subresource — what is the exact resource/verb combination needed for exec access?*

**Q12: You create a Role with `verbs: ["get"]` and `resourceNames: ["my-secret"]` on secrets. Your application still can't find the secret when it does `kubectl get secrets`. What's wrong?**
> 💡 *Hint: The application might be listing all secrets to find the one it needs — how does `list` interact with `resourceNames`?*

**Q13: After deleting a Role, the RoleBinding that referenced it still exists. What happens to subjects in that binding — do they lose access, or does something else happen?**
> 💡 *Hint: The binding still exists as an object. What does Kubernetes do when a binding references a non-existent role?*

**Q14: You run `kubectl auth can-i list pods --as=jane` and get `yes`. But Jane reports she gets "Forbidden" when running `kubectl get pods`. What could explain this discrepancy?**
> 💡 *Hint: Consider the namespace context — `can-i` defaults to the current namespace of the requester, but Jane might be running in a different namespace.*

**Q15: An operator is stuck in a loop: they need to create a Role with `create pods` permission but get "forbidden." They already have the `admin` ClusterRole in the target namespace. Why might this fail?**
> 💡 *Hint: Check whether the binding is a RoleBinding (namespaced) or ClusterRoleBinding (cluster-wide) — and whether the Role they're trying to create has permissions outside the namespace.*

---

### Architecture & Design

**Q16: When would you choose to use a ClusterRole bound with a RoleBinding (instead of a simple namespaced Role) for permissions that only need to apply in one namespace?**
> 💡 *Hint: Think about operational efficiency when you have many namespaces with identical permission requirements.*

**Q17: An attacker has compromised a pod with a ServiceAccount that only has `get pods` in one namespace. What attack paths could they explore to escalate privileges?**
> 💡 *Hint: Consider what information is available in the pod filesystem, environment variables, and what the Kubernetes API exposes even with limited access.*

**Q18: Should you use `cluster-admin` for your application's ServiceAccount if the application manages cluster resources (creates/deletes namespaces, manages CRDs)? What's the alternative?**
> 💡 *Hint: What's the minimum set of permissions needed? Can you enumerate them instead of using a wildcard role?*

**Q19: In a multi-tenant cluster, Team A's namespace admin tries to create a RoleBinding giving themselves the `cluster-admin` ClusterRole within their namespace. Why does this fail?**
> 💡 *Hint: Consider the privilege escalation rule: can a namespace admin bind a role that has MORE permissions than they currently possess?*

**Q20: You're designing RBAC for a Kubernetes operator (a controller that manages CRDs). The operator needs to create, update, and delete both its own CRDs and standard Kubernetes resources. How would you design its RBAC to follow least privilege?**
> 💡 *Hint: Think about which resources truly need write access vs. read-only, and whether namespace scope or cluster scope is needed for each resource type.*

---

## 📝 Section 6 — Multiple Choice Questions (MCQs)

---

### Beginner Questions (1–8)

**MCQ 1: Which of the following RBAC objects is namespaced (not cluster-scoped)?**

- A) ClusterRole
- B) ClusterRoleBinding
- C) Role
- D) PersistentVolume

<details>
<summary>✅ Answer</summary>

**Correct: C) Role**

A `Role` exists only within a specific namespace and can only grant access to resources in that same namespace. `ClusterRole` and `ClusterRoleBinding` are cluster-scoped objects. `PersistentVolume` is also cluster-scoped (though PersistentVolumeClaims are namespaced).
</details>

---

**MCQ 2: What is the correct `apiVersion` for RBAC objects in Kubernetes 1.22 and later?**

- A) `rbac.authorization.k8s.io/v1beta1`
- B) `rbac.authorization.k8s.io/v1`
- C) `authorization.k8s.io/v1`
- D) `k8s.io/rbac/v1`

<details>
<summary>✅ Answer</summary>

**Correct: B) `rbac.authorization.k8s.io/v1`**

The `v1beta1` API version was removed in Kubernetes 1.22. Always use `rbac.authorization.k8s.io/v1`. The other options are not valid API versions.
</details>

---

**MCQ 3: You want to allow a user to read pod logs. Which resources and verbs must be included in the Role rule?**

- A) `resources: ["pods"]`, `verbs: ["get", "log"]`
- B) `resources: ["pods/log"]`, `verbs: ["get"]`
- C) `resources: ["pods", "logs"]`, `verbs: ["get"]`
- D) `resources: ["pods"]`, `verbs: ["get", "watch"]`

<details>
<summary>✅ Answer</summary>

**Correct: B) `resources: ["pods/log"]`, `verbs: ["get"]`**

Pod logs are accessed via the `pods/log` subresource, which requires a separate rule. There is no `log` verb in Kubernetes. Option A is wrong because `log` isn't a verb. Option D only grants access to pods themselves, not their logs.
</details>

---

**MCQ 4: What does the `system:masters` group do in Kubernetes?**

- A) Grants cluster-admin access that can be revoked with RoleBindings
- B) Bypasses ALL RBAC checks — cannot be restricted by removing bindings
- C) Provides read-only access to all system components
- D) Allows access only to `kube-system` namespace

<details>
<summary>✅ Answer</summary>

**Correct: B) Bypasses ALL RBAC checks — cannot be restricted by removing bindings**

Members of `system:masters` bypass the RBAC authorization layer entirely and always have unrestricted superuser access. This cannot be revoked by removing RoleBindings. This is why you should avoid adding users to this group.
</details>

---

**MCQ 5: Which kubectl command checks if the current user can delete pods in the `production` namespace?**

- A) `kubectl auth verify delete pods -n production`
- B) `kubectl rbac check --verb=delete pods -n production`
- C) `kubectl auth can-i delete pods -n production`
- D) `kubectl check permission delete pod -n production`

<details>
<summary>✅ Answer</summary>

**Correct: C) `kubectl auth can-i delete pods -n production`**

`kubectl auth can-i` is the built-in command for checking permissions. The syntax is `kubectl auth can-i <verb> <resource> [-n namespace] [--as=subject]`. The other options don't exist in kubectl.
</details>

---

**MCQ 6: What is the core API group for Pods, Services, ConfigMaps, and Secrets?**

- A) `core`
- B) `k8s.io`
- C) `v1`
- D) `""` (empty string)

<details>
<summary>✅ Answer</summary>

**Correct: D) `""` (empty string)**

The core API group (which contains fundamental resources like pods, services, configmaps, secrets, nodes) is represented by an empty string `""` in RBAC rules. While these resources use `v1` in their `apiVersion`, the group in RBAC `apiGroups` is `""`.
</details>

---

**MCQ 7: A Pod is created without specifying `serviceAccountName`. Which ServiceAccount does it use?**

- A) No ServiceAccount — the pod has no identity
- B) The `admin` ServiceAccount
- C) The `default` ServiceAccount in its namespace
- D) The `system:serviceaccount` ServiceAccount

<details>
<summary>✅ Answer</summary>

**Correct: C) The `default` ServiceAccount in its namespace**

Every namespace has a `default` ServiceAccount created automatically. Any pod without an explicit `serviceAccountName` uses it. While the default SA has no permissions by default, its token is still mounted into the pod unless `automountServiceAccountToken: false` is set.
</details>

---

**MCQ 8: Which statement correctly describes the difference between `RoleBinding` and `ClusterRoleBinding`?**

- A) RoleBinding can only reference Roles; ClusterRoleBinding can reference both Roles and ClusterRoles
- B) RoleBinding grants permissions in one namespace; ClusterRoleBinding grants permissions cluster-wide
- C) ClusterRoleBinding is deprecated; use RoleBinding for everything
- D) RoleBinding applies to users only; ClusterRoleBinding applies to ServiceAccounts only

<details>
<summary>✅ Answer</summary>

**Correct: B) RoleBinding grants permissions in one namespace; ClusterRoleBinding grants permissions cluster-wide**

The key difference is scope. A `RoleBinding` (regardless of whether it references a Role or ClusterRole) limits permissions to the binding's namespace. A `ClusterRoleBinding` grants permissions across all namespaces and for cluster-scoped resources.
</details>

---

### Intermediate Questions (9–18)

**MCQ 9: You want to grant developer Alice the `edit` ClusterRole, but ONLY in the `staging` namespace. Which combination is correct?**

- A) ClusterRole `edit` + ClusterRoleBinding to Alice
- B) ClusterRole `edit` + RoleBinding in `staging` namespace to Alice
- C) Create a new Role called `edit` in `staging` + RoleBinding to Alice
- D) ClusterRole `edit` + ClusterRoleBinding with `namespace: staging` set

<details>
<summary>✅ Answer</summary>

**Correct: B) ClusterRole `edit` + RoleBinding in `staging` namespace to Alice**

This is the "reuse pattern" — a RoleBinding can reference a ClusterRole. The binding's namespace (`staging`) limits the scope to that namespace only. Option A would give cluster-wide access. Option D is invalid — ClusterRoleBindings don't have namespace scope.
</details>

---

**MCQ 10: What does `automountServiceAccountToken: false` on a Pod achieve?**

- A) The pod cannot access the Kubernetes API server
- B) The pod uses a different ServiceAccount
- C) The SA token is not mounted as a volume in the pod filesystem
- D) The pod's SA token is rotated every 24 hours

<details>
<summary>✅ Answer</summary>

**Correct: C) The SA token is not mounted as a volume in the pod filesystem**

Setting this to `false` prevents Kubernetes from automatically mounting the ServiceAccount token at `/var/run/secrets/kubernetes.io/serviceaccount/`. This is a security hardening measure — if the application doesn't need to call the Kubernetes API, the token should not be present in the container.
</details>

---

**MCQ 11: Which built-in ClusterRole allows a user to view most resources but NOT modify them AND NOT view Secrets?**

- A) `admin`
- B) `edit`
- C) `view`
- D) `read-only`

<details>
<summary>✅ Answer</summary>

**Correct: C) `view`**

The `view` ClusterRole provides read-only access to most namespaced resources but explicitly excludes Secrets (to prevent accidental secret exposure to read-only users). `edit` includes write access. `admin` includes write and RBAC management. `read-only` is not a built-in role.
</details>

---

**MCQ 12: The `roleRef` in a RoleBinding is immutable after creation. What must you do to change the role a binding references?**

- A) Use `kubectl edit rolebinding` to update the roleRef field
- B) Use `kubectl patch rolebinding` with the new roleRef
- C) Delete the RoleBinding and create a new one with the correct roleRef
- D) Add a second roleRef to the existing binding

<details>
<summary>✅ Answer</summary>

**Correct: C) Delete the RoleBinding and create a new one with the correct roleRef**

The `roleRef` field is immutable by design — it prevents accidental or malicious redirection of permissions. To change the role a binding references, you must delete the binding and create a new one. `kubectl edit` will reject changes to `roleRef`.
</details>

---

**MCQ 13: A ServiceAccount in namespace `monitoring` needs to list pods in ALL namespaces. Which is the correct approach?**

- A) Create a Role with `pods: list` in every namespace + one RoleBinding per namespace
- B) Create a ClusterRole with `pods: list` + ClusterRoleBinding to the SA
- C) Create a ClusterRole with `pods: list` + RoleBinding in `monitoring` namespace
- D) Create a Role with `pods: list` in `monitoring` + ClusterRoleBinding

<details>
<summary>✅ Answer</summary>

**Correct: B) Create a ClusterRole with `pods: list` + ClusterRoleBinding to the SA**

To access resources across ALL namespaces (now and in the future), you need a ClusterRoleBinding — it grants permissions cluster-wide. Option A works but is operationally painful. Option C scopes the ClusterRole to only the `monitoring` namespace via RoleBinding — doesn't solve the cross-namespace need.
</details>

---

**MCQ 14: What API group should you specify for Deployments in a Role rule?**

- A) `""` (core group)
- B) `extensions`
- C) `apps`
- D) `k8s.io/apps`

<details>
<summary>✅ Answer</summary>

**Correct: C) `apps`**

Deployments, ReplicaSets, StatefulSets, and DaemonSets are in the `apps` API group. The `extensions` group was used historically but was deprecated and most resources moved to `apps` or `networking.k8s.io`. Always use `kubectl api-resources` to verify API groups.
</details>

---

**MCQ 15: A user runs `kubectl auth can-i --list` in namespace `default`. What does this command return?**

- A) All users and their permissions in the default namespace
- B) All RBAC objects (Roles, Bindings) in the default namespace
- C) All permissions the current user has in the default namespace
- D) All permissions any user has across all namespaces

<details>
<summary>✅ Answer</summary>

**Correct: C) All permissions the current user has in the default namespace**

`kubectl auth can-i --list` shows a table of all resource/verb combinations that the current user (or specified `--as` subject) is allowed in the given namespace. It's a comprehensive permission audit for one subject. You can add `-n <namespace>` or omit for the current namespace.
</details>

---

**MCQ 16: Which RBAC verb controls `kubectl exec` into a pod?**

- A) `exec` on `pods`
- B) `get` on `pods/exec`
- C) `create` on `pods/exec`
- D) `watch` on `pods`

<details>
<summary>✅ Answer</summary>

**Correct: C) `create` on `pods/exec`**

`kubectl exec` maps to `create` on the `pods/exec` subresource. This is counterintuitive — you might expect `exec` to be the verb, but Kubernetes uses `create` for establishing exec sessions. Similarly, `port-forward` uses `create` on `pods/portforward`.
</details>

---

**MCQ 17: What happens when you delete a Role that is still referenced by an existing RoleBinding?**

- A) Kubernetes prevents the deletion until the RoleBinding is deleted first
- B) The RoleBinding is also automatically deleted
- C) The RoleBinding becomes "dangling" — subjects lose their permissions
- D) The subjects retain their permissions from the deleted role

<details>
<summary>✅ Answer</summary>

**Correct: C) The RoleBinding becomes "dangling" — subjects lose their permissions**

Kubernetes does NOT enforce referential integrity between RoleBindings and their referenced Roles. You can delete a Role while a RoleBinding still references it. The binding becomes a dangling reference — subjects have no effective permissions from that binding until a new Role with the same name is created.
</details>

---

**MCQ 18: You grant a ServiceAccount the `list secrets` permission in namespace `dev`. What data can the SA access?**

- A) Only metadata (names, labels) of secrets — not their values
- B) The full contents (data fields) of all secrets in the namespace
- C) Only secrets that have a specific label
- D) Only secrets in the `kube-system` namespace

<details>
<summary>✅ Answer</summary>

**Correct: B) The full contents (data fields) of all secrets in the namespace**

A `list` response for Secrets includes the full `data` field — the actual secret values (base64-encoded). This is a critical security consideration: `list secrets` exposes all secret values, not just metadata. Treat `list` on Secrets as equivalent to `get` for all secrets at once.
</details>

---

### Advanced Questions (19–25)

**MCQ 19: What is the purpose of `aggregationRule` in a ClusterRole?**

- A) It merges two ClusterRoles into one during creation
- B) It defines a ClusterRole whose rules are automatically combined from other ClusterRoles with matching labels
- C) It aggregates permissions across multiple namespaces
- D) It allows a ClusterRole to inherit from a parent ClusterRole

<details>
<summary>✅ Answer</summary>

**Correct: B) It defines a ClusterRole whose rules are automatically combined from other ClusterRoles with matching labels**

`aggregationRule` specifies label selectors. Kubernetes dynamically combines rules from all ClusterRoles matching those selectors. When a new matching ClusterRole is created, its rules are automatically included. This is how the built-in `view`, `edit`, and `admin` roles are extended for CRDs.
</details>

---

**MCQ 20: The `escalate` verb on `clusterroles` resource grants which dangerous capability?**

- A) Allows escalating API request priority
- B) Allows creating ClusterRoles with MORE permissions than the user currently has
- C) Allows binding users to roles with higher privilege
- D) Allows accessing escalated (cluster-scoped) resources from namespaced roles

<details>
<summary>✅ Answer</summary>

**Correct: B) Allows creating ClusterRoles with MORE permissions than the user currently has**

Normally, Kubernetes prevents users from creating roles with permissions beyond what they possess. The `escalate` verb bypasses this restriction, allowing creation of arbitrarily powerful roles. Granting `escalate` is functionally equivalent to granting `cluster-admin` because the user can create any role they want.
</details>

---

**MCQ 21: In a multi-tenant cluster, Team A's namespace admin tries to create a RoleBinding that grants the `cluster-admin` ClusterRole in their namespace. What happens?**

- A) Succeeds — namespace admins can bind any ClusterRole in their namespace
- B) Fails — you cannot use ClusterRoles in RoleBindings
- C) Fails — namespace admin doesn't have `cluster-admin` themselves, so they can't bind it (privilege escalation prevention)
- D) Succeeds but the binding is cluster-wide, not namespace-scoped

<details>
<summary>✅ Answer</summary>

**Correct: C) Fails — namespace admin doesn't have `cluster-admin` themselves, so they can't bind it (privilege escalation prevention)**

Kubernetes enforces that you cannot grant permissions you don't already possess. Since `admin` (namespace-level) doesn't include `cluster-admin` permissions, trying to create a binding to `cluster-admin` is rejected. To bypass this, a user would need the `bind` verb on `cluster-admin`, which itself requires elevated permissions.
</details>

---

**MCQ 22: An operator controls `mutatingwebhookconfigurations`. Why is this considered a high-privilege operation in RBAC terms?**

- A) Webhooks are deprecated and should not be modified
- B) Mutating webhooks can modify or read ANY object being admitted to the cluster, effectively bypassing RBAC for those objects
- C) Webhooks consume excessive cluster resources
- D) Only cluster-admin can see webhook configurations

<details>
<summary>✅ Answer</summary>

**Correct: B) Mutating webhooks can modify or read ANY object being admitted to the cluster, effectively bypassing RBAC for those objects**

A mutating webhook intercepts ALL admission requests matching its rules and can modify them. An attacker controlling a webhook could read secrets in any request, inject malicious configurations, or modify any resource being created. This is why control over webhook configurations is a high-privilege escalation risk.
</details>

---

**MCQ 23: You want to extend the built-in `view` ClusterRole to include your CRD `widgets.example.io`. What is the correct approach?**

- A) Edit the built-in `view` ClusterRole directly to add your CRD rules
- B) Create a new ClusterRole with label `rbac.authorization.k8s.io/aggregate-to-view: "true"` containing your CRD rules
- C) Create a separate ClusterRole and bind it alongside `view` for each user
- D) Modify the API server configuration to auto-include CRDs in `view`

<details>
<summary>✅ Answer</summary>

**Correct: B) Create a new ClusterRole with label `rbac.authorization.k8s.io/aggregate-to-view: "true"` containing your CRD rules**

The `view`, `edit`, and `admin` roles use `aggregationRule` with their respective labels. By creating a new ClusterRole with the matching label, your rules are automatically aggregated into `view`. This is the recommended pattern and avoids modifying built-in roles (which could be overwritten on cluster upgrades).
</details>

---

**MCQ 24: An attacker compromises a pod with a ServiceAccount that has `create pods` permission in its namespace. What is the MOST direct privilege escalation path available?**

- A) The attacker cannot escalate since `create pods` is a limited permission
- B) The attacker can create pods that mount any Secret as an environment variable or volume, accessing all secrets in the namespace
- C) The attacker can create pods only with the same ServiceAccount, limiting access
- D) The attacker must first obtain `list secrets` before accessing secret values

<details>
<summary>✅ Answer</summary>

**Correct: B) The attacker can create pods that mount any Secret as an environment variable or volume, accessing all secrets in the namespace**

`create pods` implicitly grants indirect access to all resources mountable by pods — Secrets, ConfigMaps, PersistentVolumes. The attacker can also specify any ServiceAccount in their namespace for the pod they create, inheriting that SA's permissions. This is why pod creation is treated as a high-privilege operation in security-sensitive environments.
</details>

---

**MCQ 25: A ServiceAccount has `get` on `nodes/proxy` (the proxy subresource of Nodes). What security risk does this create?**

- A) The SA can read node resource metrics only
- B) The SA has access to the Kubelet API — enabling command execution on any pod on those nodes, bypassing audit logging and admission control
- C) The SA can proxy HTTP traffic through nodes for networking purposes only
- D) The SA can view node configurations but not modify them

<details>
<summary>✅ Answer</summary>

**Correct: B) The SA has access to the Kubelet API — enabling command execution on any pod on those nodes, bypassing audit logging and admission control**

`nodes/proxy` grants access to the Kubelet API directly. This allows `exec`, `attach`, `portforward`, and other sensitive operations on ANY pod on those nodes. Critically, requests through `nodes/proxy` bypass the API server's audit logging and admission controllers — making this a very high-privilege and dangerous permission.
</details>

---

## 🧪 Section 7 — Hands-On Exercises

---

### Exercise 1: Read-Only Pod Access in a Namespace `[Beginner]`

**Objective:** Create a minimal Role that grants read-only access to pods in a specific namespace and verify it works.

**Scenario:** You're a platform engineer at a fintech company. A new QA engineer, `qa-tester`, joined your team and needs to view pods in the `fundtransfer` namespace to monitor deployments during testing. They should NOT be able to modify anything.

**Your Task:**

1. Ensure the `fundtransfer` namespace exists
2. Create a Role named `pod-viewer` in the `fundtransfer` namespace with `get`, `list`, `watch` verbs on `pods`
3. Create a RoleBinding named `qa-pod-viewer` that binds the Role to user `qa-tester`
4. Verify the user can list pods but cannot delete them

**YAML Solution:**
```yaml
# namespace.yaml (if needed)
apiVersion: v1
kind: Namespace
metadata:
  name: fundtransfer

---
# role-pod-viewer.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-viewer
  namespace: fundtransfer
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]

---
# rolebinding-qa.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: qa-pod-viewer
  namespace: fundtransfer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-viewer
subjects:
  - kind: User
    name: qa-tester
    apiGroup: rbac.authorization.k8s.io
```

**Verification Commands:**
```bash
kubectl apply -f namespace.yaml -f role-pod-viewer.yaml -f rolebinding-qa.yaml

# Confirm can list pods
kubectl auth can-i list pods --as=qa-tester -n fundtransfer

# Confirm cannot delete pods
kubectl auth can-i delete pods --as=qa-tester -n fundtransfer

# Confirm cannot access other namespaces
kubectl auth can-i list pods --as=qa-tester -n default

# List all permissions for qa-tester
kubectl auth can-i --list --as=qa-tester -n fundtransfer
```

**Expected Output:**
```
yes
no
no

Resources                           Non-Resource URLs   Resource Names   Verbs
pods                                []                  []               [get list watch]
```

**Challenge Extension:** Add `pods/log` access so the QA engineer can also view pod logs (`get` verb on `pods/log`).

---

### Exercise 2: Bind a ClusterRole to a ServiceAccount in a Specific Namespace `[Beginner]`

**Objective:** Learn the ClusterRole + RoleBinding pattern — reuse a ClusterRole while scoping permissions to one namespace.

**Scenario:** Your AI agent needs to be able to view pods, deployments, services, and configmaps in the `ai-workloads` namespace. Instead of creating a custom Role, use the built-in `view` ClusterRole.

**Your Task:**
1. Create namespace `ai-workloads`
2. Create a ServiceAccount `ai-reader-sa` in `ai-workloads`
3. Create a RoleBinding that binds the built-in `view` ClusterRole to `ai-reader-sa` — scoped to `ai-workloads` only
4. Verify the SA has the expected access

**YAML Solution:**
```yaml
# ai-rbac.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-workloads

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ai-reader-sa
  namespace: ai-workloads

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ai-reader-view-binding
  namespace: ai-workloads          # Scoped to THIS namespace only
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole                # References built-in ClusterRole
  name: view                       # Built-in 'view' ClusterRole
subjects:
  - kind: ServiceAccount
    name: ai-reader-sa
    namespace: ai-workloads
```

**Verification Commands:**
```bash
kubectl apply -f ai-rbac.yaml

# Can view pods in ai-workloads
kubectl auth can-i list pods \
  --as=system:serviceaccount:ai-workloads:ai-reader-sa \
  -n ai-workloads

# Cannot view pods in default (binding is scoped)
kubectl auth can-i list pods \
  --as=system:serviceaccount:ai-workloads:ai-reader-sa \
  -n default

# Cannot delete deployments (view is read-only)
kubectl auth can-i delete deployments \
  --as=system:serviceaccount:ai-workloads:ai-reader-sa \
  -n ai-workloads

# Cannot view secrets (view excludes secrets)
kubectl auth can-i get secrets \
  --as=system:serviceaccount:ai-workloads:ai-reader-sa \
  -n ai-workloads
```

**Expected Output:**
```
yes
no
no
no
```

**Challenge Extension:** Now create a second RoleBinding for the SAME SA in the `staging` namespace, granting the same `view` access. Verify the SA can now view pods in both `ai-workloads` and `staging`.

---

### Exercise 3: Developer Role — Full Access Except Delete `[Intermediate]`

**Objective:** Create a custom Role that grants all common development actions but explicitly withholds delete permissions.

**Scenario:** The `fundtransfer` team has developers who need to deploy, scale, and debug applications. However, your security policy prevents any automated process from deleting resources (to avoid accidental data loss). Create a role with everything they need except delete.

**Your Task:**
1. Create a Role `dev-no-delete` in `fundtransfer` with:
   - Full access to pods, deployments, services, configmaps (get, list, watch, create, update, patch)
   - Access to pod logs and exec
   - NO delete or deletecollection
2. Create a ServiceAccount `dev-sa` and bind the role
3. Verify delete is denied, exec is allowed

**YAML Solution:**
```yaml
# dev-role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: dev-no-delete
  namespace: fundtransfer
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps", "endpoints"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
    # NO "delete" or "deletecollection"
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create"]             # exec uses "create" verb
  - apiGroups: ["apps"]
    resources: ["deployments/scale"]
    verbs: ["get", "update", "patch"]  # Allow scaling

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dev-sa
  namespace: fundtransfer

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-no-delete-binding
  namespace: fundtransfer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: dev-no-delete
subjects:
  - kind: ServiceAccount
    name: dev-sa
    namespace: fundtransfer
```

**Verification Commands:**
```bash
kubectl apply -f dev-role.yaml

# Can create pods (yes)
kubectl auth can-i create pods \
  --as=system:serviceaccount:fundtransfer:dev-sa -n fundtransfer

# Cannot delete pods (no)
kubectl auth can-i delete pods \
  --as=system:serviceaccount:fundtransfer:dev-sa -n fundtransfer

# Can exec (yes)
kubectl auth can-i create pods/exec \
  --as=system:serviceaccount:fundtransfer:dev-sa -n fundtransfer

# Can scale (yes)
kubectl auth can-i update deployments/scale \
  --as=system:serviceaccount:fundtransfer:dev-sa -n fundtransfer
```

**Expected Output:**
```
yes
no
yes
yes
```

**Challenge Extension:** The policy changes — developers now CAN delete pods (to restart them) but CANNOT delete deployments or services. Update the role accordingly.

---

### Exercise 4: Configure a Pod with a Minimal ServiceAccount `[Intermediate]`

**Objective:** Deploy a pod that uses a dedicated ServiceAccount with pinned resource access (resourceNames).

**Scenario:** Your AI order-processing agent in `fundtransfer` needs access to exactly ONE ConfigMap (`order-config`) and ONE Secret (`payment-api-key`). No other resources. Build the complete stack.

**YAML Solution:**
```yaml
# complete-agent-rbac.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: fundtransfer

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: order-agent-sa
  namespace: fundtransfer
automountServiceAccountToken: true

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: order-agent-role
  namespace: fundtransfer
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get"]
    resourceNames: ["order-config"]     # Only this ConfigMap
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
    resourceNames: ["payment-api-key"]  # Only this Secret

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: order-agent-binding
  namespace: fundtransfer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: order-agent-role
subjects:
  - kind: ServiceAccount
    name: order-agent-sa
    namespace: fundtransfer

---
# Test ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: order-config
  namespace: fundtransfer
data:
  max-retries: "3"
  timeout: "30s"

---
# Fake secret for testing
apiVersion: v1
kind: Secret
metadata:
  name: payment-api-key
  namespace: fundtransfer
stringData:
  key: "test-api-key-1234"

---
# The Pod itself
apiVersion: v1
kind: Pod
metadata:
  name: order-agent
  namespace: fundtransfer
spec:
  serviceAccountName: order-agent-sa
  automountServiceAccountToken: true
  containers:
    - name: agent
      image: curlimages/curl:latest
      command: ["sleep", "3600"]
```

**Verification Commands:**
```bash
kubectl apply -f complete-agent-rbac.yaml

# Can get its specific ConfigMap
kubectl auth can-i get configmap order-config \
  --as=system:serviceaccount:fundtransfer:order-agent-sa -n fundtransfer

# Cannot get a different ConfigMap
kubectl auth can-i get configmap other-config \
  --as=system:serviceaccount:fundtransfer:order-agent-sa -n fundtransfer

# Cannot list configmaps (list + resourceNames doesn't restrict at list level)
kubectl auth can-i list configmaps \
  --as=system:serviceaccount:fundtransfer:order-agent-sa -n fundtransfer

# Can get its specific Secret
kubectl auth can-i get secret payment-api-key \
  --as=system:serviceaccount:fundtransfer:order-agent-sa -n fundtransfer
```

**Expected Output:**
```
yes
no
no
yes
```

**Challenge Extension:** Add a second ConfigMap `feature-flags` to the allowed list in the role without recreating the entire stack.

---

### Exercise 5: Audit and Fix a Broken Deployment with `auth can-i` `[Intermediate]`

**Objective:** Debug an RBAC misconfiguration that prevents an application from functioning, using `kubectl auth can-i`.

**Scenario:** You deployed a self-healing agent that watches its own Deployment and restarts it if unhealthy. The agent is failing with `403 Forbidden`. It needs to: list pods, get/update its own deployment, and get configmaps. Diagnose what's missing.

**Broken Setup:**
```yaml
# broken-setup.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: healer-sa
  namespace: default

---
# BROKEN: Missing some verbs and resources
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: healer-role-broken
  namespace: default
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get"]                # Missing "list", "watch"
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get"]                # Missing "update", "patch" needed for restart

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: healer-binding
  namespace: default
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: healer-role-broken
subjects:
  - kind: ServiceAccount
    name: healer-sa
    namespace: default
```

**Diagnostic Commands:**
```bash
# Apply broken setup
kubectl apply -f broken-setup.yaml

# Diagnose: list all permissions
kubectl auth can-i --list \
  --as=system:serviceaccount:default:healer-sa -n default

# Test specific operations
kubectl auth can-i list pods \
  --as=system:serviceaccount:default:healer-sa -n default    # Should be no

kubectl auth can-i update deployments \
  --as=system:serviceaccount:default:healer-sa -n default    # Should be no

kubectl auth can-i get configmaps \
  --as=system:serviceaccount:default:healer-sa -n default    # Should be no
```

**Fixed Role:**
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: healer-role-fixed
  namespace: default
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]        # Added list, watch
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "update", "patch"]  # Added update, patch
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]                 # Added missing resource
```

**Challenge Extension:** Update the RoleBinding to use the fixed role instead of the broken one (remember: roleRef is immutable — delete and recreate).

---

### Exercise 6: Build an Aggregated ClusterRole for a CRD `[Advanced]`

**Objective:** Extend the built-in `view` role to include a custom resource using aggregation.

**Scenario:** Your team has installed a custom `AIModel` CRD (`aimodels.ml.company.io`). Teams using the `view` ClusterRole cannot see AIModel resources. Extend `view` without modifying the built-in role.

**YAML Solution:**
```yaml
# First, simulate a CRD (simplified)
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: aimodels.ml.company.io
spec:
  group: ml.company.io
  names:
    plural: aimodels
    singular: aimodel
    kind: AIModel
  scope: Namespaced
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

---
# Aggregation ClusterRole — automatically included in view/edit/admin
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: aimodel-viewer
  labels:
    # These labels trigger aggregation into built-in roles
    rbac.authorization.k8s.io/aggregate-to-view: "true"
    rbac.authorization.k8s.io/aggregate-to-edit: "true"
    rbac.authorization.k8s.io/aggregate-to-admin: "true"
rules:
  - apiGroups: ["ml.company.io"]
    resources: ["aimodels"]
    verbs: ["get", "list", "watch"]

---
# Test ServiceAccount bound to 'view'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: viewer-sa
  namespace: default

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: viewer-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: view
subjects:
  - kind: ServiceAccount
    name: viewer-sa
    namespace: default
```

**Verification Commands:**
```bash
kubectl apply -f aggregation-example.yaml

# The 'view' role should now include aimodels access
kubectl auth can-i list aimodels \
  --as=system:serviceaccount:default:viewer-sa

# Verify the aggregation worked in the view ClusterRole
kubectl get clusterrole view -o yaml | grep -A5 "ml.company.io"
```

**Expected Output:**
```
yes
# Should see ml.company.io in the view ClusterRole rules
```

**Challenge Extension:** Create a separate write-only aggregation ClusterRole for `edit` that also includes `create`, `update`, `patch`, `delete` for AIModels.

---

### Exercise 7: Set Up RBAC for a CI/CD ServiceAccount `[Advanced]`

**Objective:** Create production-grade RBAC for a GitHub Actions pipeline that deploys to multiple namespaces.

**Scenario:** Your CI/CD pipeline (running in the `ci-system` namespace) needs to update Deployment images in `production`, `staging`, and `dev` namespaces. Minimal permissions only — no ability to create new resources or delete anything.

**YAML Solution:**
```yaml
# ci-rbac.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ci-system

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ci-deployer
  namespace: ci-system
automountServiceAccountToken: true

---
# ClusterRole with minimal deployment update permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ci-image-updater
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "patch", "update"]    # update image only
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]              # monitor rollout
  - apiGroups: ["apps"]
    resources: ["replicasets"]
    verbs: ["get", "list"]                        # verify rollout

---
# Bind to production namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ci-deployer-production
  namespace: production                           # Scoped to production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ci-image-updater
subjects:
  - kind: ServiceAccount
    name: ci-deployer
    namespace: ci-system

---
# Same binding for staging
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ci-deployer-staging
  namespace: staging
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ci-image-updater
subjects:
  - kind: ServiceAccount
    name: ci-deployer
    namespace: ci-system

---
# Same binding for dev
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ci-deployer-dev
  namespace: dev
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ci-image-updater
subjects:
  - kind: ServiceAccount
    name: ci-deployer
    namespace: ci-system
```

**Verification Commands:**
```bash
kubectl apply -f ci-rbac.yaml

# Can update deployments in production
kubectl auth can-i patch deployments \
  --as=system:serviceaccount:ci-system:ci-deployer -n production

# Cannot delete deployments
kubectl auth can-i delete deployments \
  --as=system:serviceaccount:ci-system:ci-deployer -n production

# Cannot create new resources
kubectl auth can-i create deployments \
  --as=system:serviceaccount:ci-system:ci-deployer -n production

# Cannot access secrets
kubectl auth can-i get secrets \
  --as=system:serviceaccount:ci-system:ci-deployer -n production
```

**Challenge Extension:** The pipeline also needs to create/update ConfigMaps as part of deployments. Add this permission to the ClusterRole.

---

### Exercise 8: Implement Namespace Isolation RBAC for Two Teams `[Advanced]`

**Objective:** Build a complete multi-tenant RBAC setup where two teams have identical permissions within their own namespaces but are completely isolated from each other.

**Scenario:** Teams `alpha` and `beta` each have their own namespace. Each team has developers who need full workload management. A compromised pod in team-alpha must not be able to access team-beta's resources.

**YAML Solution:**
```yaml
# multi-tenant-rbac.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
  labels:
    team: alpha
    pod-security.kubernetes.io/enforce: restricted

---
apiVersion: v1
kind: Namespace
metadata:
  name: team-beta
  labels:
    team: beta
    pod-security.kubernetes.io/enforce: restricted

---
# Shared ClusterRole — used by both teams via RoleBindings
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: team-workload-manager
rules:
  - apiGroups: ["", "apps", "batch"]
    resources: ["pods", "deployments", "services", "configmaps", "jobs", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods/log", "pods/exec"]
    verbs: ["get", "create"]
  # Note: NO secrets access, NO RBAC management, NO delete

---
# Team Alpha ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: alpha-agent
  namespace: team-alpha
automountServiceAccountToken: false   # Disable until needed

---
# Team Alpha RoleBinding — scoped to team-alpha only
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: alpha-workload-binding
  namespace: team-alpha
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: team-workload-manager
subjects:
  - kind: ServiceAccount
    name: alpha-agent
    namespace: team-alpha
  - kind: Group
    name: team-alpha-devs
    apiGroup: rbac.authorization.k8s.io

---
# Team Beta ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: beta-agent
  namespace: team-beta
automountServiceAccountToken: false

---
# Team Beta RoleBinding — scoped to team-beta only
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: beta-workload-binding
  namespace: team-beta
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: team-workload-manager
subjects:
  - kind: ServiceAccount
    name: beta-agent
    namespace: team-beta
  - kind: Group
    name: team-beta-devs
    apiGroup: rbac.authorization.k8s.io
```

**Verification Commands:**
```bash
kubectl apply -f multi-tenant-rbac.yaml

# Alpha agent CAN access team-alpha
kubectl auth can-i list pods \
  --as=system:serviceaccount:team-alpha:alpha-agent -n team-alpha

# Alpha agent CANNOT access team-beta (isolation verified)
kubectl auth can-i list pods \
  --as=system:serviceaccount:team-alpha:alpha-agent -n team-beta

# Beta agent CANNOT access team-alpha
kubectl auth can-i list pods \
  --as=system:serviceaccount:team-beta:beta-agent -n team-alpha

# Neither can access secrets
kubectl auth can-i get secrets \
  --as=system:serviceaccount:team-alpha:alpha-agent -n team-alpha
```

**Expected Output:**
```
yes
no
no
no
```

**Challenge Extension:** Add a `shared-config` namespace with ConfigMaps that BOTH teams' agents need read-only access to. How would you structure this without giving cross-namespace write access?

---

### Exercise 9: Detect and Fix a Privilege Escalation Vulnerability `[Advanced]`

**Objective:** Identify a dangerous RBAC misconfiguration that enables privilege escalation, then fix it.

**Scenario:** A security audit flagged that `dev-ops-sa` in the `operations` namespace has a dangerous configuration. Find the vulnerability and remediate it.

**Vulnerable Setup:**
```yaml
# VULNERABLE — do not deploy to production
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dev-ops-sa
  namespace: operations

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: dev-ops-role
rules:
  - apiGroups: [""]
    resources: ["pods", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["clusterrolebindings"]     # ⚠️ DANGEROUS
    verbs: ["create", "update", "bind"]   # ⚠️ Can bind ANY ClusterRole!
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch"]       # ⚠️ Full secret access
  - apiGroups: [""]
    resources: ["nodes/proxy"]            # ⚠️ Node proxy — kubelet access
    verbs: ["get"]
```

**Vulnerability Analysis:**
```bash
# What can this SA do with ClusterRoleBindings?
kubectl auth can-i create clusterrolebindings \
  --as=system:serviceaccount:operations:dev-ops-sa

# Can it bind cluster-admin?
# YES! The 'bind' verb on clusterrolebindings allows binding ANY role
# This is a complete privilege escalation path to cluster-admin!
```

**Fixed ClusterRole:**
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: dev-ops-role-fixed
rules:
  - apiGroups: [""]
    resources: ["pods", "configmaps"]
    verbs: ["get", "list", "watch"]
  # REMOVED: clusterrolebindings access — no RBAC management
  # REMOVED: secrets list/get cluster-wide — too broad
  # REMOVED: nodes/proxy — kubelet API access
  - apiGroups: [""]
    resources: ["pods/log"]              # Only pod logs, not node proxy
    verbs: ["get"]
```

**Challenge Extension:** The operations team legitimately needs to view Events cluster-wide for debugging. Add this minimal permission to the fixed role.

---

### Exercise 10: Full Multi-Tenant RBAC Architecture from Scratch `[Advanced]`

**Objective:** Design and implement a complete, production-ready multi-tenant RBAC architecture for a three-team cluster with shared infrastructure.

**Scenario:** Build RBAC for:
- Team `payments` — processes financial transactions (high security)
- Team `analytics` — runs data pipelines (medium security)
- Namespace `shared-infra` — shared databases and message queues (read-only for both teams)
- `platform-ops` group — cluster operators who can manage everything
- `security-auditor` group — read-only access everywhere

**Complete Solution:**
```yaml
# full-multitenant-rbac.yaml
# ========== NAMESPACES ==========
apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    team: payments
    environment: production
    pod-security.kubernetes.io/enforce: restricted

---
apiVersion: v1
kind: Namespace
metadata:
  name: analytics
  labels:
    team: analytics
    environment: production

---
apiVersion: v1
kind: Namespace
metadata:
  name: shared-infra
  labels:
    purpose: shared

---
# ========== SERVICE ACCOUNTS ==========
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payments-agent
  namespace: payments
automountServiceAccountToken: false

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: analytics-agent
  namespace: analytics

---
# ========== SHARED CLUSTERROLES ==========
# Team workload access (used per-namespace via RoleBindings)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: team-workload-full
rules:
  - apiGroups: ["", "apps", "batch", "autoscaling"]
    resources:
      - pods
      - deployments
      - services
      - configmaps
      - jobs
      - cronjobs
      - horizontalpodautoscalers
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods/log", "pods/exec"]
    verbs: ["get", "create"]

---
# Shared infra read-only access
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: shared-infra-reader
rules:
  - apiGroups: [""]
    resources: ["services", "endpoints", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["statefulsets"]
    verbs: ["get", "list", "watch"]

---
# ========== NAMESPACE BINDINGS ==========
# Payments team
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: payments-team-binding
  namespace: payments
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: team-workload-full
subjects:
  - kind: Group
    name: team-payments
    apiGroup: rbac.authorization.k8s.io
  - kind: ServiceAccount
    name: payments-agent
    namespace: payments

---
# Analytics team
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: analytics-team-binding
  namespace: analytics
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: team-workload-full
subjects:
  - kind: Group
    name: team-analytics
    apiGroup: rbac.authorization.k8s.io
  - kind: ServiceAccount
    name: analytics-agent
    namespace: analytics

---
# Both teams can read shared-infra
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: payments-shared-infra-read
  namespace: shared-infra
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: shared-infra-reader
subjects:
  - kind: Group
    name: team-payments
    apiGroup: rbac.authorization.k8s.io

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: analytics-shared-infra-read
  namespace: shared-infra
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: shared-infra-reader
subjects:
  - kind: Group
    name: team-analytics
    apiGroup: rbac.authorization.k8s.io

---
# ========== PLATFORM OPS (cluster-admin) ==========
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: platform-ops-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: Group
    name: platform-ops
    apiGroup: rbac.authorization.k8s.io

---
# ========== SECURITY AUDITOR (read-only everywhere) ==========
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: security-auditor-view
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: view
subjects:
  - kind: Group
    name: security-auditors
    apiGroup: rbac.authorization.k8s.io
```

**Verification Commands:**
```bash
kubectl apply -f full-multitenant-rbac.yaml

# Payments agent can deploy in payments
kubectl auth can-i create deployments \
  --as=system:serviceaccount:payments:payments-agent -n payments

# Payments agent CANNOT deploy in analytics
kubectl auth can-i create deployments \
  --as=system:serviceaccount:payments:payments-agent -n analytics

# Payments team can READ shared-infra
kubectl auth can-i list services \
  --as-group=team-payments --as=fake-user -n shared-infra

# Analytics team CANNOT WRITE to shared-infra
kubectl auth can-i create configmaps \
  --as-group=team-analytics --as=fake-user -n shared-infra
```

**Challenge Extension:** Add Resource Quotas to each namespace and verify that even with RBAC permissions, teams cannot exceed their resource quotas (demonstrating that RBAC + Quotas provide layered security).

---

## 📋 Section 8 — Quick Reference Card

---

### RBAC Object Comparison

| Property | Role | ClusterRole | RoleBinding | ClusterRoleBinding |
|----------|------|-------------|-------------|-------------------|
| Scope | Namespace | Cluster | Namespace | Cluster |
| Can reference | — | — | Role or ClusterRole | ClusterRole only |
| Contains | Permission rules | Permission rules | Subject + roleRef | Subject + roleRef |
| Namespace field | Required | Not allowed | Required | Not allowed |
| Use case | Namespace-specific perms | Cluster-wide or reusable | Bind in one namespace | Bind cluster-wide |

---

### All RBAC Verbs

| Verb | Maps To | Notes |
|------|---------|-------|
| `get` | GET /resource/name | Single resource read |
| `list` | GET /resource | All resources of type (includes full content for Secrets!) |
| `watch` | GET /resource?watch=true | Stream changes |
| `create` | POST /resource | Also used for exec, portforward |
| `update` | PUT /resource/name | Full replace |
| `patch` | PATCH /resource/name | Partial update |
| `delete` | DELETE /resource/name | Single delete |
| `deletecollection` | DELETE /resource | Bulk delete |
| `escalate` | — | Create roles with higher permissions (danger!) |
| `bind` | — | Bind roles user doesn't have (danger!) |
| `impersonate` | — | Act as another identity (danger!) |

---

### Built-In ClusterRole Comparison

| ClusterRole | Read All | Write Workloads | Delete | Manage RBAC | View Secrets |
|-------------|----------|-----------------|--------|-------------|-------------|
| `view` | ✅ (except Secrets) | ❌ | ❌ | ❌ | ❌ |
| `edit` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ (namespace) | ✅ |
| `cluster-admin` | ✅ Everything | ✅ Everything | ✅ Everything | ✅ Everything | ✅ Everything |

---

### Top 5 `kubectl auth can-i` Patterns

```bash
# 1. Check current user
kubectl auth can-i create pods -n production

# 2. Check as a specific user
kubectl auth can-i delete secrets --as=jane@company.com -n staging

# 3. Check as a ServiceAccount (full SA notation required)
kubectl auth can-i get configmaps \
  --as=system:serviceaccount:fundtransfer:agent-sa -n fundtransfer

# 4. List ALL permissions for a subject
kubectl auth can-i --list \
  --as=system:serviceaccount:default:my-sa -n default

# 5. Check subresource access
kubectl auth can-i create pods/exec \
  --as=system:serviceaccount:default:dev-sa -n default
```

---

### 🔐 Top 5 RBAC Security Best Practices

1. **Least Privilege** — Grant only the exact verbs and resources needed. Enumerate explicitly; never use wildcards (`*`) in production.

2. **Namespace Scope First** — Prefer RoleBindings over ClusterRoleBindings. Limit blast radius by keeping permissions namespaced.

3. **Dedicated ServiceAccounts** — One ServiceAccount per workload. Never use the `default` SA for applications. Set `automountServiceAccountToken: false` if the app doesn't call the Kubernetes API.

4. **Never Use `system:masters`** — This group permanently bypasses all RBAC checks and cannot be restricted. Avoid adding any user to this group.

5. **Periodic Audit** — Regularly review bindings (`kubectl get clusterrolebindings -o wide`), check for unused SAs, and verify no dangling bindings to deleted identities exist. Use `kubectl auth can-i --list` to audit subjects.

### 🛡️ Danger Verbs to Watch For

| Verb/Resource | Risk Level | Why Dangerous |
|--------------|------------|---------------|
| `escalate` on roles | 🔴 Critical | Creates roles with any permissions |
| `bind` on roles | 🔴 Critical | Binds any role including cluster-admin |
| `impersonate` | 🔴 Critical | Act as any user/SA in the cluster |
| `get/list` secrets | 🔴 High | Exposes all secret values |
| `create` pods | 🔴 High | Mount any secret, run as any SA |
| `nodes/proxy` | 🔴 High | Bypass audit + access Kubelet API |
| `create` PVs | 🟠 Medium | Mount hostPath to access node FS |
| `patch` namespaces | 🟠 Medium | Change Pod Security Admission labels |
| `mutatingwebhooks` write | 🟠 Medium | Read/modify any admitted object |

---

## 📚 Further Reading

| Resource | URL | Description |
|----------|-----|-------------|
| Official RBAC Documentation | https://kubernetes.io/docs/reference/access-authn-authz/rbac/ | Complete reference |
| RBAC Good Practices | https://kubernetes.io/docs/concepts/security/rbac-good-practices/ | Security guidance |
| Controlling Access to K8s API | https://kubernetes.io/docs/concepts/security/controlling-access/ | Authentication + Authorization pipeline |
| Service Account Admin | https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/ | Deep dive on SAs |
| Pod Security Standards | https://kubernetes.io/docs/concepts/security/pod-security-standards/ | Complements RBAC |
| Kubernetes Security Checklist | https://kubernetes.io/docs/concepts/security/security-checklist/ | Production checklist |
| Authentication Mechanisms | https://kubernetes.io/docs/reference/access-authn-authz/authentication/ | How users authenticate |
| User Impersonation | https://kubernetes.io/docs/reference/access-authn-authz/user-impersonation/ | Impersonation reference |

---

*Document generated from: Official Kubernetes Documentation (v1.35), Kubernetes For AI Services course (Agent Factory, March 2026), and kubernetes.io RBAC Good Practices.*

*Last updated: March 2026 | Kubernetes API version: rbac.authorization.k8s.io/v1*
