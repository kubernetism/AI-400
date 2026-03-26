---                                                                                                                      
  Plan: Task Manager with Docker & Kubernetes                                                                              
                                                                                                                           
  Phase 1: Backend (FastAPI REST API)
                                                                                                                           
  1. Create backend/ folder with pyproject.toml (deps: fastapi, uvicorn)                                                   
  2. Write backend/main.py — in-memory Task CRUD API:
    - GET /tasks — list all tasks                                                                                          
    - GET /tasks/{id} — get one task                                                                                       
    - POST /tasks — create task
    - PATCH /tasks/{id} — update task                                                                                      
    - DELETE /tasks/{id} — delete task                                                                                   
    - GET /health — health endpoint (bonus)                                                                                
  3. Create backend/Dockerfile — Python 3.11 + uv, expose port 8000
                                                                                                                           
  Phase 2: Frontend (Web UI)                                                                                             
                                                                                                                           
  4. Update frontend/main.py — FastAPI app serving Jinja2 template, reads API_URL from env                                 
  5. Create frontend/templates/index.html — simple task manager UI (add/edit/delete tasks via fetch to backend)
  6. Update frontend/pyproject.toml — add deps (fastapi, uvicorn, jinja2, httpx)                                           
  7. Create frontend/Dockerfile — Python 3.11 + uv, expose port 3000                                                       
                                                                                                                           
  Phase 3: Docker                                                                                                          
                                                                                                                           
  8. Create docker/ folder with a docker-compose.yaml to run both services together locally                                
  9. Create docker/README.md — how to build & run with Docker
                                                                                                                           
  Phase 4: Kubernetes
                                                                                                                           
  10. Create kubernetes/deployments.yaml:
    - Backend Deployment (2 replicas for bonus)
    - Frontend Deployment (1 replica, API_URL env var pointing to backend service)                                         
  11. Create kubernetes/Services.yaml:                                                                                     
    - Backend: ClusterIP service on port 8000 (internal only)                                                              
    - Frontend: NodePort service on port 3000 (external access)                                                            
  12. Add readiness/liveness probes using /health endpoints (bonus)
  13. Create kubernetes/README.md — deployment instructions                                                                
                  
  Key Design Decisions                                                                                                     
                  
  ┌─────────────────────────┬──────────────────┬─────────────────────────────────────────────────────────────────┐         
  │        Decision         │      Choice      │                               Why                               │
  ├─────────────────────────┼──────────────────┼─────────────────────────────────────────────────────────────────┤         
  │ Backend ↔ Frontend comm │ API_URL env var  │ Frontend calls backend via K8s DNS: http://backend-service:8000 │
  ├─────────────────────────┼──────────────────┼─────────────────────────────────────────────────────────────────┤         
  │ Backend service type    │ ClusterIP        │ Only frontend needs to reach it, no external access needed      │         
  ├─────────────────────────┼──────────────────┼─────────────────────────────────────────────────────────────────┤         
  │ Frontend service type   │ NodePort         │ Users access the UI from outside the cluster                    │         
  ├─────────────────────────┼──────────────────┼─────────────────────────────────────────────────────────────────┤         
  │ Storage                 │ In-memory (dict) │ Per the challenge spec — tasks are lost on pod restart          │
  └─────────────────────────┴──────────────────┴─────────────────────────────────────────────────────────────────┘         
                  
  ---                                                                                                                      
  Want me to start building this out?