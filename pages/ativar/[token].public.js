import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ActiveUser() {
  const router = useRouter()
  const { token } = router.query

  const [userActivated, setUserActivated] = useState('');

  async function handleActivate(token) {
    try{
    const response = await fetch(`../api/v1/activate/${token}`)
    .then(response => response.json())
    .then(data => data)

     if(response.features){
       setUserActivated('Usuário Ativado com Sucesso!');
      }else{
        setUserActivated(response.message);
     }

    }catch (error) {
      console.log(error);
   }
  }

  useEffect(() => {
    if(token){
      handleActivate(token)
    }
  } , [token])


return (
  <h1>{userActivated}</h1>
)
}


