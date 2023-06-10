## Setting up the Sample

I wish there was more to it in a way but there isn't. It all feels super simple. And once the SDK Integration is put into Step Functions, this will go from building an SQS re-drive with Golang and Step Functions to building an SQS re-drive just Step Functions.

### Running the Infrastructure Code

```bash
cdk deploy # will deploy all the code
```

Resources created

-   Lambdas
    -   Redriver
    -   Redrive status check
    -   Processor
-   SQS
    -   Sample Queue
    -   Dead Letter Queue
-   Step Functions
    -   Workflow State Machine
-   CloudWatch
    -   Lambda log groups
    -   State Machine log group

### Processor Lambda

There is a Processor Lambda in this code as well. It reads from the primary SQS to let you simulate failure and success. In the processor CDK code, there is an environment variable that indicates how the processor should work. It's the `FAIL` variable. `true` means the Lambda will be put in Failure Mode

```typescript
this._func = new GoFunction(scope, `ProcessorFunc`, {
    entry: "src/processor",
    functionName: "processor",
    timeout: Duration.seconds(30),
    environment: {
        IS_LOCAL: "false",
        LOG_LEVEL: "debug",
        FAIL: "true",
    },
});
```

```golang
func handler(ctx context.Context, event events.SQSEvent) error {
	log.WithFields(log.Fields{
		"message": event,
	}).Info("Handling Processing")

	fail, _ := strconv.ParseBool(os.Getenv("FAIL"))

	if fail {
		return errors.New("in failure mode")
	}

	return nil
}
```

### Putting a Message on the Queue

```bash
aws sqs send-message --queue-url https://sqs.<region>.amazonaws.com/<account-id>/sample --message-body "Hello World"
```

### Starting the State Machine

```bash
aws stepfunctions start-execution --state-machine-arn arn:aws:states:<region>:<account>:stateMachine:SqsRedriveWorkflow --input "{\"queueArn\": \"arn:aws:sqs:<region>:<account>:sample-dlq\"}"
```
