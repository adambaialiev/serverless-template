# Setup

## Setup ~/.aws/credentials file

```
[wallet-dev-${your name}]
aws_access_key_id =
aws_secret_access_key =
```

## deploy your own dev environment

```
yarn dev --stage <wallet-dev-${your name}>
```

## Authentication Reference

#### Sign up

```http
  POST <your dev URL>/auth/sign-up
```

| Parameter     | Type     | Description                     |
| :------------ | :------- | :------------------------------ |
| `phoneNumber` | `string` | **Required**. Your phone number |

#### Login

```http
  POST <your dev URL>/auth/sign-in
```

| Parameter     | Type     | Description                     |
| :------------ | :------- | :------------------------------ |
| `phoneNumber` | `string` | **Required**. Your phone number |

#### Login verify

```http
  POST <your dev URL>/auth/sign-in/verify
```

| Parameter     | Type     | Description                                                                 |
| :------------ | :------- | :-------------------------------------------------------------------------- |
| `phoneNumber` | `string` | **Required**. Your phone number                                             |
| `passCode`    | `string` | **Required**. Your passcode that you got by SMS notification to your number |
| `session`     | `string` | **Required**. Session you retrieved after Login                             |

#### Refresh token

```http
  POST <your dev URL>/auth/refreshToken
```

| Parameter      | Type     | Description                      |
| :------------- | :------- | :------------------------------- |
| `refreshToken` | `string` | **Required**. Your refresh token |
