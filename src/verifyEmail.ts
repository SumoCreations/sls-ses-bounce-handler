import * as AWS from 'aws-sdk'
import * as EmailValidator from 'email-validator'

export const verifyEmail = async (email: string): Promise<boolean> => {
  if (!EmailValidator.validate(email)) {
    return false
  }
  const client = new AWS.DynamoDB.DocumentClient()
  const result = await client
    .query({
      TableName: process.env.DYNAMODB_BLACKLIST_TABLE || '',
      KeyConditionExpression:
        'partitionKey = :hkey and begins_with(sortKey, :prefix)',
      ExpressionAttributeValues: {
        ':hkey': email,
        ':prefix': 'Blacklist',
      },
    })
    .promise()
  return result.Count === 0
}
