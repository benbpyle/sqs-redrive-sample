import { GoFunction } from "@aws-cdk/aws-lambda-go-alpha";

import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { IQueue } from "aws-cdk-lib/aws-sqs";

export class StartRedriveFunc extends Construct {
    private readonly _func: GoFunction;

    get func(): IFunction {
        return this._func;
    }

    constructor(scope: Construct, id: string, queue: IQueue, dlq: IQueue) {
        super(scope, id);

        this._func = new GoFunction(scope, `StartRedriveFunc`, {
            entry: "src/start-redrive",
            functionName: "redrive",
            timeout: Duration.seconds(30),
            environment: {
                IS_LOCAL: "false",
                LOG_LEVEL: "debug",
            },
        });

        this._func.addToRolePolicy(
            new PolicyStatement({
                actions: [
                    "sqs:StartMessageMoveTask",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes",
                ],
                effect: Effect.ALLOW,
                resources: [dlq.queueArn],
            })
        );

        queue.grantSendMessages(this._func);
    }
}
