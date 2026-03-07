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

