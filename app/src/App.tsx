import React, { useState, useCallback, useEffect } from 'react';
import firebase from 'firebase';

const firebaseConfig = {
  apiKey: "AIzaSyB2RZ94LoT8mQjOkldbSQbJ3Zo6JlpwN2g",
  authDomain: "karszawa-180305.firebaseapp.com",
  databaseURL: "https://karszawa-180305.firebaseio.com",
  projectId: "karszawa-180305",
  storageBucket: "karszawa-180305.appspot.com",
  messagingSenderId: "396328415531",
  appId: "1:396328415531:web:d38380642ec7edab0e156e"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const functions = firebase.functions();
const signUpForCustomers = functions.httpsCallable("signUpForCustomers") as (params: { email: string; password: string }) => Promise<{ data: { token: string } }>;
const createCustomToken = functions.httpsCallable("createCustomToken") as (params: { uid: string }) => Promise<{ data: { token: string } }>;

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authToken, setAuthToken] = useState('');

  const signUp = useCallback(() => {
    (async () => {
      // const { data } = await signUpForCustomers({ email, password });
      const { data } = await createCustomToken({ uid: email });
      const { user } = await auth.signInWithCustomToken(data.token);

      const token = await user?.getIdToken(true) ?? "";

      alert(token);

      setAuthToken(token);
    })();
  }, [email, password]);

  const signIn = useCallback(() => {
    (async () => {
      const { user } = await auth.signInWithEmailAndPassword(email, password)
      const token = await user?.getIdToken(true) ?? "";

      console.log({ token });

      setAuthToken(token);
    })();
  }, [email, password]);

  return (
    <div className="App">
      {
        authToken
      ?
        <Data authToken={authToken} />
      :
        <>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          <button onClick={signUp}>Sign Up</button>
          <button onClick={signIn}>Sign In</button>
        </>
      }
    </div>
  );
}

interface DataProps {
  authToken: string;
}

const Data: React.FC<DataProps> = ({ authToken }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const response = await fetch("https://karszawa-hasura.herokuapp.com/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query: "{ users { id } }"
        }),
      });

      const body = await response.json();

      console.log({ body });

      setLoading(false);
    })();
  }, [setLoading, authToken]);

  if (loading) return <p>loading...</p>;

  return <p>done</p>;
}

export default App;
