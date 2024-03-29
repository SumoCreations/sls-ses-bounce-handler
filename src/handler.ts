import { APIGatewayProxyHandler, SNSHandler } from 'aws-lambda'
import { BlacklistType, blacklistEmail } from './blacklistEmail'
import { logDelivery } from './logDelivery'
import { verifyEmail } from './verifyEmail'

interface IRecipient {
  emailAddress: string
  action: string
  status: string
  diagnosticCode: string
}

interface IBounce {
  bounceType: string
  bounceSubType: string
  bouncedRecipients: IRecipient[]
}

interface IMessage {
  notificationType: string
  timestamp: string
  feedbackId: string
  remoteMtaIp: string
  reportingMTA: string
}

interface IBounceMessage extends IMessage {
  bounce: IBounce
}

interface IComplaint {
  complainedRecipients: { emailAddress: string }[]
  complaintFeedbackType: string
}

interface IComplaintMessage extends IMessage {
  complaint: IComplaint
}

const getEmails = (s: string) => s.match(/\S+[a-z0-9]@[a-z0-9\.]+/gim)

export const bounce: SNSHandler = async (event, _context) => {
  await Promise.all(
    event.Records.map((r) => JSON.parse(r.Sns.Message) as IBounceMessage).map(
      async ({ bounce }) => {
        const blacklistType = [
          BlacklistType.Bounce,
          bounce.bounceType,
          bounce.bounceSubType,
        ]
        await Promise.all(
          bounce.bouncedRecipients.map(async (r) => {
            const email = (getEmails(r.emailAddress) || [])[0]
            await blacklistEmail(email, [...blacklistType, r.status, r.action])
          })
        )
      }
    )
  )
}

export const complaint: SNSHandler = async (event, _context) => {
  await Promise.all(
    event.Records.map(
      (r) => JSON.parse(r.Sns.Message) as IComplaintMessage
    ).map(async ({ complaint }) => {
      const blacklistType = [
        BlacklistType.Complaint,
        complaint.complaintFeedbackType,
      ]
      await Promise.all(
        complaint.complainedRecipients.map(async (r) => {
          const email = (getEmails(r.emailAddress) || [])[0]
          await blacklistEmail(email, [...blacklistType])
        })
      )
    })
  )
}

interface IDelivery {
  timestamp: string
  processingTimeMillis: number
  recipients: string[]
  smtpResponse: string
  remoteMtaIp: string
  reportingMTA: string
}

interface IDeliveryResponse {
  notificationType: string
  delivery: IDelivery
}

export const delivery: SNSHandler = async (event, _context) => {
  await Promise.all(
    event.Records.map(
      (r) => JSON.parse(r.Sns.Message) as IDeliveryResponse
    ).map(async ({ delivery: { recipients } }) => {
      console.log(recipients)
      await Promise.all(
        recipients.map(async (r) => {
          const email = (getEmails(r) || [])[0]
          await logDelivery(email)
        })
      )
    })
  )
}

export const verify: APIGatewayProxyHandler = async (event, _context) => {
  const email = event?.queryStringParameters?.email
  if (!email || !(await verifyEmail(email))) {
    return {
      statusCode: 400,
      body: 'invalid email',
    }
  }
  return {
    statusCode: 200,
    body: 'ok',
  }
}
