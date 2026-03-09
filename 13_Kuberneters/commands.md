# Chapter 13 Commands
   - kubectl run bb --image=busybox --restart=Never -- env
   - kubectl exec -it bb -- /bin/bash
   - k exec -it nginx -- /bin/sh
   - k exec -it nginx -- env
   - kubectl logs bb
   - kubectl run bb2 --image=busybox --restart=Never -- /bin/sh -c 'echo helloworld'
   - kubectl logs bb2
   -  2045  k run bb --image=busybox -it --rm  --restart=Never  -- /bin/sh -c "echo start class && echo EverythingISGood && echo PakistanZindabad && sleep 14 && echo Finished-Job"
## Getting Fastapi Pod Ip
   -  FASTAPI_IP=$(kubectl get pod fastapi -o jsonpath='{.status.podIP}')
   -  echo $FASTAPI_IP
   -  