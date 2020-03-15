import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Email 前提の登録処理とログイン処理

const additionalClaims = {
  "https://hasura.io/jwt/claims": {
    "x-hasura-allowed-roles": ["customer"],
    "x-hasura-default-role": "customer",
    "x-hasura-user-id": "1234567890",
    "x-hasura-org-id": "123",
    "x-hasura-custom": "custom-value",
  }
}

// NOTE: Custom Token による Sign Up / Sign In は常にひとつのエンドポイントが使われる
export const createCustomToken = functions.https.onCall(async (data, context) => {
  // const provider = data.provider;
  // const accessToken = data.accessToken;

  const uid = data.uid; // verify accessToken and get uid for the provider

  const token = await admin.auth().createCustomToken(uid, additionalClaims);

  // NOTE: 存在しないユーザーに対しては実行できない & createCustomToken によるログインでは初回ログイン時にユーザーが作成される
  // await admin.auth().setCustomUserClaims(uid, additionalClaims);

  return { token };
});

// NOTE: Email による Sign Up （Sign In はクライアントだけで処理 → そのため setCustomUserClaims が必要になる）
export const signUpForCustomers = functions.https.onCall(async (data, context) => {
  const email = data.email;
  const password = data.password;

  const user = await admin.auth().createUser({ email, password });

  // NOTE: 存在するユーザーの場合は想定通りに動作する
  // NOTE: 事前に Claims を設定しておけば createCustomToken では設定しなくても良い
  // NOTE: createCustomToken では Claims は保存されないが setCutomuserClaims なら保存される（のでクライアントでおもむろに signInWithEmailAndPassword を実行しても適切に Claims が設定されている）
  await admin.auth().setCustomUserClaims(user.uid, additionalClaims);

  const token = await admin.auth().createCustomToken(user.uid);

  return { token };
});
