# Kubernetes Deployment

## Prerequisites
- Docker images built and available locally (or in a registry)
- kubectl configured to a running cluster (minikube, kind, etc.)

## Build Images

```bash
docker build -t task-backend:latest ../backend/
docker build -t task-frontend:latest ../frontend/
```

If using **minikube**, load images into it:
```bash
minikube image load task-backend:latest
minikube image load task-frontend:latest
```

## Deploy

```bash
kubectl apply -f deployments.yaml
kubectl apply -f Services.yaml
```

## Access the App

```bash
# If using minikube:
minikube service frontend-service

# Otherwise:
# Frontend is on NodePort 30000 → http://<node-ip>:30000
```

## Verify

```bash
kubectl get pods
kubectl get svc
```

## How It Works

- **Backend Service** (`ClusterIP`): Only accessible inside the cluster. Frontend reaches it via `http://backend-service:8000`.
- **Frontend Service** (`NodePort`): Exposed on port 30000 for external access.
- **API_URL env var**: The frontend deployment injects `http://backend-service:8000` so the web UI knows where to send API requests.
- **Health Probes**: Both services have `/health` endpoints with readiness and liveness probes configured.
- **Backend replicas: 2**: Kubernetes load-balances requests across both pods. Since tasks are in-memory, each pod has its own state (tasks may differ between pods).

## Questions to Explore

1. **ClusterIP vs NodePort vs LoadBalancer**: ClusterIP is internal-only, NodePort exposes on a static port on each node, LoadBalancer provisions a cloud LB.
2. **Why NodePort for frontend?**: Users need external access. Backend only needs internal cluster access.
3. **What if backend service name changes?**: Update the `API_URL` env var in the frontend deployment.
4. **K8s DNS**: Pods resolve `backend-service` via CoreDNS → `backend-service.<namespace>.svc.cluster.local`.
5. **Tasks lost on restart**: Since storage is in-memory, restarting a backend pod clears its tasks. A real app would use a database.
