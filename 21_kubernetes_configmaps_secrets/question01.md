 i have question if i have 3 pods running and in yaml i said pod is exposed on 30001 nordport and i'm accessing  
 it on localhost:30001, my question is that the same ip target all 3 pods or just one. these 3 pods are using for 
 load balancing or what.                                                                                          

● Great question! Here's how it works:

  NodePort + Multiple Pods = Built-in Load Balancing

  When you access localhost:30001, the traffic flow is:

  localhost:30001 (NodePort)
         │
         ▼
     kube-proxy  ──── uses iptables/IPVS rules
         │
         ├──→ Pod 1  (33% traffic)
         ├──→ Pod 2  (33% traffic)
         └──→ Pod 3  (33% traffic)

  Yes, all 3 pods receive traffic — it's automatic load balancing.

  How It Works

  1. You don't hit a pod directly — you hit the Service (NodePort type)
  2. The Service has a selector that matches all 3 pods (via labels)
  3. kube-proxy running on each node distributes traffic across all matching pods
  4. Default algorithm is random/round-robin (iptables mode)

  Example

  # Deployment — creates 3 pods
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: my-app
  spec:
    replicas: 3          # ← 3 pods
    selector:
      matchLabels:
        app: my-app
    template:
      metadata:
        labels:
          app: my-app    # ← this label connects pods to Service
      spec:
        containers:
        - name: my-app
          image: my-image
          ports:
          - containerPort: 8000
  ---
  # Service — exposes all 3 pods on NodePort
  apiVersion: v1
  kind: Service
  metadata:
    name: my-app-service
  spec:
    type: NodePort
    selector:
      app: my-app        # ← matches all 3 pods with this label
    ports:
    - port: 80
      targetPort: 8000
      nodePort: 30001

  Key Points

  ┌───────────────────┬────────────────────────────────────────────────────────────┐
  │      Concept      │                          Behavior                          │
  ├───────────────────┼────────────────────────────────────────────────────────────┤
  │ Same request      │ Goes to one pod (not all 3)                                │
  ├───────────────────┼────────────────────────────────────────────────────────────┤
  │ Multiple requests │ Distributed across all 3 pods                              │
  ├───────────────────┼────────────────────────────────────────────────────────────┤
  │ Algorithm         │ Random (iptables) or round-robin (IPVS)                    │
  ├───────────────────┼────────────────────────────────────────────────────────────┤
  │ Unhealthy pod     │ Automatically excluded from rotation                       │
  ├───────────────────┼────────────────────────────────────────────────────────────┤
  │ Session affinity  │ Off by default (can enable with sessionAffinity: ClientIP) │
  └───────────────────┴────────────────────────────────────────────────────────────┘

  To Verify

  # See which pods are behind the service
  kubectl get endpoints my-app-service

  # Watch logs on all 3 pods to see traffic distribution
  kubectl logs -l app=my-app -f

  So to directly answer: each request on localhost:30001 hits only ONE pod, but across multiple requests, traffic is distributed to all 3 pods — that's the load
   balancing.
