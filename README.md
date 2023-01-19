# Setup

## Setup ~/.aws/credentials file

```
[wallet-dev-${your name}]
aws_access_key_id =
aws_secret_access_key =
```

## Create your own dev domain

```
sls create_domain --stage <wallet-dev-${your name}>
```

## Deploy your own dev environment

```
yarn dev --stage <wallet-dev-${your name}>

Example enpoint: https://wallet-adam-dev-api.shopwalletapp.com/v1/api/shop-wallet/auth/sign-up
```

## Authentication Reference

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

| Parameter     | Type       | Description                                     |
| :------------ | :--------- | :---------------------------------------------- | --------------------------------------------------------------------------- | --- |
| `phoneNumber` | `string`   | **Required**. Your phone number                 |
| `passCode`    | `string`   | **Required**. 555666                            |
| <!--          | `passCode` | `string`                                        | **Required**. Your passcode that you got by SMS notification to your number | --> |
| `session`     | `string`   | **Required**. Session you retrieved after Login |

#### Refresh token

```http
  POST <your dev URL>/auth/refreshToken
```

| Parameter      | Type     | Description                      |
| :------------- | :------- | :------------------------------- |
| `refreshToken` | `string` | **Required**. Your refresh token |
