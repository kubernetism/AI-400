# Built a simple Task Manager application with two services:

Backend Folder - FastAPI REST API that stores tasks in memory
Frontend Folder - A lightweight web UI that talks to the backend API
Docker Folder-  will contain all docker files
kubernetes - folder will contain all k8s manifest files.


## Project Structure

        challenge01/
        ├── backend/
        │   ├── main.py            # Task CRUD API
        │   ├── Dockerfile
        │   ├── pyproject.toml
        │   └── uv.lock
        ├── frontend/
        │   ├── main.py            # Serves the web UI
        │   ├── templates/
        │   │   └── index.html     # Task manager page
        │   ├── pyproject.toml
        │   └── uv.lock 
        ├── docker
        │   ├── dockerfile 
        │   └── README.md 
        ├── kubernetes
        │   ├── deployments.yaml
        │   ├── Services.yaml 
        │   └── README.md 
        │ 
        └── README.md

# Running Locally

## Terminal 1 - Backend
cd backend && uv run uvicorn main:app --port 8000

## Terminal 2 - Frontend
cd frontend && uv run uvicorn main:app --port 3000
Open http://localhost:3000 to use the app.

# API Endpoints
Method	Endpoint	Description
GET	/tasks	List all tasks
GET	/tasks/{id}	Get a task
POST	/tasks	Create a task
PATCH	/tasks/{id}	Update a task
DELETE	/tasks/{id}	Delete a task
GET	/docs	Swagger UI
GET	/redoc	ReDoc

# Challenge 1: Deploy Both Services in Kubernetes
Your goal is to deploy both the frontend and backend in Kubernetes and make them communicate with each other.

## What You Need To Do
Build Docker images for both frontend and backend
Create Kubernetes manifests (Deployment + Service) for each
Make the frontend talk to the backend inside the cluster
## Hints
The frontend uses the API_URL environment variable to know where the backend is
In Kubernetes, services can talk to each other using internal DNS
The DNS format is: http://<service-name>.<namespace>.svc.cluster.local:<port>
For services in the same namespace, just http://<service-name>:<port> works
You will need a ClusterIP service for the backend (internal only)
You will need a NodePort service for the frontend (external access)
Pass API_URL to the frontend deployment using env in the container spec
## Questions To Explore
What is the difference between ClusterIP, NodePort, and LoadBalancer?
Why does the frontend need a NodePort but the backend only needs ClusterIP?
What happens if the backend service name changes? How does the frontend know?
How does Kubernetes DNS resolution work inside a pod?
## Bonus
Add a /health endpoint to both services and configure readiness/liveness probes
Try scaling the backend to 2 replicas — does the frontend still work? Why?
What happens to tasks when a backend pod restarts?

# Good luck and happy coding!

● All done. Here's what was created:

  Summary

  ┌───────────────────────────────┬────────────────────────────────────────────────────────────────┐
  │             File              │                            Purpose                             │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ backend/main.py               │ FastAPI CRUD API — GET/POST/PATCH/DELETE /tasks + /health      │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ backend/pyproject.toml        │ Dependencies (fastapi, uvicorn)                                │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ backend/Dockerfile            │ Python 3.11 + uv image, port 8000                              │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ frontend/main.py              │ FastAPI + Jinja2, serves UI, reads API_URL from env            │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ frontend/templates/index.html │ Task manager UI — add, toggle, delete tasks                    │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ frontend/pyproject.toml       │ Updated with fastapi, uvicorn, jinja2                          │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ frontend/Dockerfile           │ Python 3.11 + uv image, port 3000                              │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ docker/docker-compose.yaml    │ Runs both services, wires API_URL                              │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ docker/README.md              │ Docker usage instructions                                      │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ kubernetes/deployments.yaml   │ Backend (2 replicas) + Frontend deployments with health probes │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ kubernetes/Services.yaml      │ Backend: ClusterIP:8000, Frontend: NodePort:30000              │
  ├───────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ kubernetes/README.md          │ K8s deployment guide + answers to challenge questions          │
  └───────────────────────────────┴────────────────────────────────────────────────────────────────┘

  Quick Start

  Local: Run backend on port 8000 and frontend on port 3000 with uv run uvicorn main:app

  Docker: cd docker && docker compose up --build

  K8s: Build images → kubectl apply -f deployments.yaml -f Services.yaml

  Note: The frontend calls the backend API directly from the browser. In Docker, API_URL=http://backend:8000 works for
  server-side rendering, but since the JS runs in the browser, you'd access the backend at http://localhost:8000. In K8s
  with NodePort, you may need to expose the backend too or use an ingress. Let me know if you want me to adjust this
  architecture.