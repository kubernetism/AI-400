# Kubernetes Namespaces

## What is a Namespace?

A namespace is a **logical partition** within a cluster — a **virtual sub-cluster** that provides an isolated boundary where multiple resources (pods, services, deployments, configmaps, secrets) can live together.

Think of it like **apartments in a building**:

- The **building** = the cluster (shared infrastructure, networking, nodes)
- Each **apartment** = a namespace (own resources, own locks/permissions, own resource limits)

A namespace is **not** limited to a single application. You can run many deployments, services, and pods inside one namespace. It's an **organizational and isolation boundary**, not an application runtime.

## Does a Cluster Have Many Namespaces?

Yes. A single Kubernetes cluster can have many namespaces. Every cluster starts with at least these built-in ones:

- `default` — where resources go if you don't specify a namespace
- `kube-system` — core K8s components (API server, DNS, etc.)
- `kube-public` — publicly readable cluster info

You can create as many additional namespaces as needed (e.g., `dev`, `staging`, `prod`, or per-team namespaces).

## What Namespaces Give You

| Feature | What it means |
|---|---|
| **Resource scoping** | Pods/services/deployments belong to a namespace. Same name can exist in different namespaces without conflict |
| **Quota enforcement** | You can cap CPU/memory/storage per namespace so one team can't starve others |
| **Access control (RBAC)** | You can give Team A access only to namespace `team-a`, not `team-b` |
| **Environment separation** | Run `dev`, `staging`, `prod` in the same cluster but fully isolated |

## Cross-Namespace Communication

Communication between namespaces is possible via DNS:

```
<service-name>.<namespace>.svc.cluster.local
```

For example, a service in `dev` can reach a service in `prod` (if allowed by network policies) using:

```
my-service.prod.svc.cluster.local
```
