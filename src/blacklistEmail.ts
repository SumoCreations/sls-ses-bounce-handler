import * as AWS from 'aws-sdk'

export enum BlacklistType {
  Bounce = "Bounce",
  Complaint = "Complaint"
}

interface IItem {
  partitionKey: string
  sortKey: string
}

export const blacklistEmail = async (email: string, blacklistType: string[]): Promise<IItem> => {
  const client = new AWS.DynamoDB.DocumentClient()
  const Item: IItem = { partitionKey: email, sortKey: ["Blacklist", ...blacklistType, new Date().toISOString()].join("#") }
  const params = {
    TransactItems: [
      {
        Put: {
          Item,
          TableName: process.env.DYNAMODB_BLACKLIST_TABLE || '',
        },
      },
    ],
  }
  await client.transactWrite(params).promise()
  console.log(Item)
  return Item
}