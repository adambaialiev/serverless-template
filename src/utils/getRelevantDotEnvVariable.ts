type SlackType =
    'SLACK_GET_BALANCES_URL'
    | 'SLACK_UPDATE_PRICES_URL'
    | 'SLACK_MAKE_TRANSACTION_URL'
    | 'SLACK_GET_TRANSACTION_URL'
    | 'SLACK_CREATE_WALLET_URL'
    | 'SLACK_FEEDBACK_URL'
    | 'SLACK_SUPPORT_URL'


export const getRelevantDotEnvVariable = (value: SlackType): string => {
    return process.env[`${(process.env.stage).toUpperCase()}_${value}`]
}