# Topic of the day Related to CKAD, related to CLuster access in on cloud.
- last class we studied namespaces, rolebase access, rolebinding.
  - Goverance importance through RBAC in Kubernetes.
  - Now Level Up the topic
    - checking out what is my context, cluster, access of cluster , how to make sure what kind of services we have and what kind of servieces we need.
  - first check kubectl cluster-info
  - kubectl config --help
  - then check your current context run kubectl get context.
  - run kubectl config view. (give detailed view of cluster, the important things to see is Cluster,Context,Users)
  - Cluster have certificate to validate the user auth.
  - Context have combine Cluster+User+Namespace. 
  - User is details of Current logged in user.
  - Question: if we were on cloud, they give us managed user. but you have to figure out what is your namespace, and the context you are working on.
# How to create a namespace with our personal context. (simply binding namespace with context).
## create a namespace 
  - kubectl create namespace dev-team
  - checking can we create namespace.
  - kubectl auth can-i create ns
  - kubectl config view -raw
  - kubectl get ns
  - kubectl -n dev-team create sa devuser
  - kubectl get sa devuser -n dev-team
  - kubectl -n dev-team get sa devuser -o yaml
## service account is like a user and every use must have key, lets create one.
  -  kubeclt create -n dev-team token devuser 
  -  touch role.yaml
  -  kubectl create role dev-role --resource=pods --verb=get,list,watch,create,delete -n dev-team --dry-run=client
  -  save this in role.yaml and run kubectl create/apply -f role.yaml
  -  now binding
  -  kubectl create rolebinding devuser-rb --role=devuser-role --serviceaccount=dev-team:devuser -n dev-team --dry-run=client -o yaml > devuser-rb.yaml
  -   kubectl config current-context
  -   kubectl config set-credentials devuser
