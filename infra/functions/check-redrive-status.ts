import { GoFunction } from "@aws-cdk/aws-lambda-go-alpha";

import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { IQueue } from "aws-cdk-lib/aws-sqs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export class CheckRedriveStatusFunc extends Construct {
    private readonly _func: GoFunction;

    get func(): IFunction {
        return this._func;
    }

    constructor(scope: Construct, id: string, queue: IQueue) {
        super(scope, id);

        this._func = new GoFunction(scope, `CheckRedriveStatusFunc`, {
            entry: "src/check-redrive-status",
            functionName: "check-redrive-status",
            timeout: Duration.seconds(30),
            environment: {
                IS_LOCAL: "false",
                LOG_LEVEL: "debug",
            },
        });

        this._func.addToRolePolicy(
            new PolicyStatement({
                actions: [
                    "sqs:ListMessageMoveTasks",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes",
                ],
                effect: Effect.ALLOW,
                resources: [queue.queueArn],
            })
        );
    }
}
