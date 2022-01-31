import * as AWS from 'aws-sdk'

interface IItem {
  partitionKey: string
  sortKey: string
  email: string
}

export const logDelivery = async (email: string): Promise<IItem> => {
  const client = new AWS.DynamoDB.DocumentClient()
  const timestamp = new Date().toISOString()
  const Item: IItem = {
    partitionKey: `${email}@${timestamp}`,
    sortKey: ['Delivery', new Date().toISOString()].join('#'),
    email,
  }
  const params = {
    TransactItems: [
      {
        Put: {
          Item,
          TableName: process.env.DYNAMODB_DELIVERIES_TABLE || '',
        },
      },
    ],
  }
  await client.transactWrite(params).promise()
  return Item
}
