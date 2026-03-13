1) create a namspace by the name of cicd-team
2) create a user or serviceaccount by the name of cicduser
3) create a credentials token for user / serivesaccount cicduser
4) create a role for user which can access deployments and pods, can list,create,watch,delete, in the current namespace
   1) output put the file and save it.
   2) also perform kubectl apply -f
5) Now bind the role with user / serviceaccount.
6) apply the rolebinding
7) Now set the user Credentials username --token="x0wxjs82s0s"
8) Now create a context with the name of cicduser@docker-desktop --user=user --namespace=ns --cluster=clustername
9) Now use use-context command to switch to another context
10) Test and Verify