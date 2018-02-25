# lambda-pr-notify-bot

A slackbot that reminds reviewers to review their pull requests on AWS.

Related project: [kentaro-m/pr-notify-bot: A slackbot that reminds reviewers to review their pull requests.](https://github.com/kentaro-m/pr-notify-bot)

## Feature

* Send notifications to Slack
  * Pull request can be merged
  * Pull request review request is created
  * Mention comment is created on a pull request
* Add reviewers to pull requests
* Manege WIP pull request by using a label

![](./images/demo.png)

## Architecture

![](./architecture.png)

## Usage

### How to set up webhook on GitHub

* Go to your project settings > Webhooks > Add webhook
* **Payload URL** `https://<API ID>.execute-api.<AWS Region>.amazonaws.com/<Stage Name>/webhook`
* **Content type** `application/json`
* **Secret** any value
* **Events** Pull request, Pull request review, Pull request review comment, Issue comment

### How to run the bot on AWS

```
$ git clone https://github.com/kentaro-m/lambda-pr-notify-bot.git
$ cd lambda-pr-notify-bot
$ npm install
$ npm run package
```

Installing packages and building code.

```
{
  "host": "", // Required if using GitHub Enterprise
  "pathPrefix": "", // Required if using GitHub Enterprise
  "repositories": [ // Repositories that allows bot actions
    "unleash-sample"
  ],
  "reviewers": [ // Pull request reviewers (GitHub username)
    "matsushita-kentaro"
  ],
  "approveComments": [ // Comment on approving pull request
    "+1",
    "LGTM"
  ],
  "numApprovers": 1, // Number of people required for pull request approval
  "slackUsers": { // Association between Slack user name and Github user name
    "matsushita-kentaro": "kentaro",
    "kentaro-m": "kentaro"
  },
  "message": { // Message to notify to Slack
    "requestReview": "Please review this pull request.",
    "ableToMerge": "Able to merge this pull request.",
    "mentionComment": "Please check this review comment."
  },
  "labels": {
    "wip": {
      "name": "wip", // display label name
      "color": "efb85f" // label color
    }
  },
  "workInProgress": true, // Bot manages WIP pull request by using a wip label
  "assignReviewers": true, // Bot adds a assignees to the pull request
  "requestReview": true, // Bot adds a reviewers to the pull request
  "ableToMerge": true, // Notify Slack that pull requests can be merged
  "mentionComment": true // Notify mention comment to Slack
}
```

Add reviewers (GitHub username), repositories and Slack username to `config/default.json`. Also, if necessary change other setting items.

* **GITHUB_API_TOKEN** A token for obtaining information on pull requests (scope: repo)
* **SLACK_API_TOKEN** A token for sending messages to Slack (scope: chat:write:bot)
* **SECRET_TOKEN** A token for securing webhook

Add environment variables to pr-notify-bot.yml. (or Add environment variables on the Lambda management console.)

```
$ aws cloudformation package --template-file pr-notify-bot.yml --s3-bucket <Your bucket name> --output-template .sam/packaged.yml
$ aws cloudformation deploy --template-file ./.sam/packaged.yml --stack-name <Your stack name> --capabilities CAPABILITY_IAM
```

Upload the SAM template to S3 and deploy it.

### Options: Execute a Lambda Function on VPC

Please use it when assigning a static IP to execute a Lambda Function. Also, if necessary, please specify security group and subnet as parameters (An array of literal strings that are separated by commas.).

* **SecurityGroupIds** The list of Security Group IDs for the HTTPS Access.
* **PrivateSubnetIds** The list of VPC Private Subnet IDs for running the Lambda Function.

```
$ aws cloudformation package --template-file pr-notify-bot-on-vpc.yml --s3-bucket <Your bucket name> --output-template .sam/packaged.yml
$ aws cloudformation deploy --template-file ./.sam/packaged.yml --stack-name <Your stack name> --parameter-overrides SecurityGroupIds=<SecurityGroupIds value> PrivateSubnetIds=<PrivateSubnetIds value> --capabilities CAPABILITY_IAM
```

## Demo

### When a pull request can be merged, notify an author

![](./images/able_to_merge.gif)

### When a pull request review request is created, notify reviewers

![](./images/assign_to_reviewer.gif)

### When a mention comment is created on a pull request, notify recipients

![](./images/check_review_comment.gif)

### Whan a pull request is opened, assign reviewers.

![](./images/auto_assign.gif)

## License

MIT
