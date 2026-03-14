1) DONE : create a namspace by the name of cicd-team
2) DONE : create a user or serviceaccount by the name of cicduser
3) DONE : create a credentials token for user / serivesaccount cicduser
eyJhbGciOiJSUzI1NiIsImtpZCI6IlRaejNHUU9KOXJBNEt3ZHptWDUzdDlWOFlLWEF1Snh1cFVHVnBneVJkVUEifQ.eyJhdWQiOlsiaHR0cHM6Ly9rdWJlcm5ldGVzLmRlZmF1bHQuc3ZjLmNsdXN0ZXIubG9jYWwiXSwiZXhwIjoxNzczNDMxMzg3LCJpYXQiOjE3NzM0Mjc3ODcsImlzcyI6Imh0dHBzOi8va3ViZXJuZXRlcy5kZWZhdWx0LnN2Yy5jbHVzdGVyLmxvY2FsIiwianRpIjoiZGQwNWU1NjctMDUxYy00NzU0LTlhZjktMDA4NjhjNDBhY2VhIiwia3ViZXJuZXRlcy5pbyI6eyJuYW1lc3BhY2UiOiJjaWNkLXRlYW0iLCJzZXJ2aWNlYWNjb3VudCI6eyJuYW1lIjoiY2ljZHVzZXIiLCJ1aWQiOiJkNDUyMmFiYi04M2Y0LTRmYTEtYjRhOS02Njc2MmNjZWUxMTYifX0sIm5iZiI6MTc3MzQyNzc4Nywic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmNpY2QtdGVhbTpjaWNkdXNlciJ9.m3tcJxWojGg8uZeHaTLHiwCjuKUaIIMG_4g1cnN4pKRTBSjCjXwDlj6I2QnAzG4IEVp3U5W-WZZyh0m1sfjWBZBp8IzfmgQT5yudWFVOtVomnbnk1wLkoI9dPejvSlL_dj3FuUWLNzDbO8L_JvYGzJshoTxXfObwL_FJs9bvbGhvKwe9Agr5SclxlTDGRSCffSaHuoeVVX2lUp_GJEczAFc8rG4wkVOlXVITSKMa_Cl8tpdoNh_KkpUTI3D6kvdfM0_xYXv692k7PN8z3dcpi43Iwu_Wp5hcvKdQ5xJ3Q7XtXiRmQCcqF8mfVEuVRWYSAUxbhPXDcHIaaQcadmmRtQ


4) DONE : create a role for user which can access deployments and pods, can list,create,watch,delete, in the current namespace
   1) output put the file and save it.
   2) also perform kubectl apply -f
5) DONE : Now bind the role with user / serviceaccount.
6) DONE : apply the rolebinding
7) DONE : Now set the user Credentials username --token="x0wxjs82s0s"
8) DONE : Now create a context with the name of cicduser@docker-desktop --user=user --namespace=ns --cluster=clustername
9) DONE : Now use use-context command to switch to another context
10)DONE :  Test and Verify
