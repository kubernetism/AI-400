# Manifests — Production Pods Workload Management

This folder contains runnable example manifests illustrating production-ready pod/workload patterns.

Prerequisites:
- A working Kubernetes cluster and `kubectl` configured.
- `metrics-server` installed for HPA examples (optional but recommended).

Apply everything:

```bash
kubectl apply -f manifests/
```

Quickly test the nginx example and load generator:

```bash
kubectl apply -f manifests/01-nginx-deployment.yaml
kubectl apply -f manifests/07-load-generator-job.yaml
kubectl get pods -w
kubectl top pod
```

Notes:
- The canary manifests show how to run a parallel canary Deployment; traffic splitting (percent-based) requires a service mesh (Istio/Linkerd) or an Ingress/LoadBalancer that supports weighted routing.
- The StatefulSet uses dynamic provisioning via a `StorageClass` named `standard`; adjust to your environment.
- NetworkPolicy examples assume a CNI that supports NetworkPolicy (Calico, Cilium, etc.).

Files in this folder:
- `01-nginx-deployment.yaml` — Deployment + Service with resources and probes.
- `02-hpa.yaml` — HPA for the nginx Deployment.
- `03-pdb.yaml` — PodDisruptionBudget example.
- `04-canary.yaml` — Stable + canary deployments and example Services.
- `05-networkpolicy.yaml` — Lockdown allowing only `frontend`→`backend`.
- `06-statefulset-postgres.yaml` — Postgres StatefulSet with PVC template.
- `07-load-generator-job.yaml` — Job to generate load against `web-stable` Service.
