kubectl get all -n nginx-ns
kubectl apply -f role.yaml --dry-run=client -o yaml

kubectl create serviceaccount deployer -n fundtransfer --dry-run=client -o yaml
k apply -f role.yaml --dry-run=client -o yaml
kubectl create serviceaccount deployer -n fundtransfer --dry-run=client -o yaml
kubectl create serviceaccount deployer -n fundtransfer --dry-run=client -o yaml > serviceaccount.yaml
head serviceaccount.yaml 
kubectl apply -f serviceaccount.yaml -n fundtransfer 
kubectl api-resources | grep rolebindings
kubectl explain rolebindings > explainRoleBindings.md
kubectl explain rolebindings.subjects > RoleBindingSubjects.md
kubectl explain rolebinding.subjects.apiGroup > rolebinding.subjects.apiGroup.md
k get sa -n fundtransfer
k apply -f rolebindings.yaml --dry-run=client
k apply -f rolebindings.yaml -n fundtransfer
k get rolebindings -n fundtransfer

Self Testing commands

kubectl auth can-i create deployments -n fundtransfer --as system:serviceaccount:fundtransfer:deployer

kubectl auth can-i create deployments -n fundtransfer --as system:serviceaccount:fundtransfer:deployer
terminal Response = no

kubectl auth can-i create deployments -n fundtransfer --as system:serviceaccount:fundtransfer:deployer-sa
yes

kubectl create role --help

kubectl run nginx-new --image=nginx:alpine --restart=Never --port=80 (--port=80 means internal port)
kubectl get pods -w
kubectl port-forward nginx 8080:80  (External Port: Internal Port)
kubectl run nginx-new --image=nginx:alpine --restart=Never --port=80 -o yaml > nginx-pods.yaml
kubectl run nginx-new --image=nginx:alpine --restart=Never --port=80 --dry-run=client -o yaml > nginx-pods.yam

