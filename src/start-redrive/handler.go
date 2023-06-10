package main

import (
	"context"
	"os"
	"strconv"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	log "github.com/sirupsen/logrus"
)

var client *sqs.Client

func handler(ctx context.Context, event *Payload) (*Payload, error) {
	log.Info("Handling redrive")

	input := &sqs.StartMessageMoveTaskInput{
		SourceArn: &event.QueueArn,
	}

	output, err := client.StartMessageMoveTask(ctx, input)

	if err != nil {
		log.WithFields(log.Fields{
			"err": err,
		}).Error("Error starting redrive")
		return nil, err
	}

	n := &Payload{
		QueueArn: event.QueueArn,
		Status:   "INITIATED",
	}

	log.WithFields(log.Fields{
		"output": output,
	}).Info("Redrive started")
	return n, nil
}

func main() {
	lambda.Start(handler)
}

func init() {
	isLocal, _ := strconv.ParseBool(os.Getenv("IS_LOCAL"))
	log.SetFormatter(&log.JSONFormatter{
		PrettyPrint: isLocal,
	})

	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic("configuration error, " + err.Error())
	}

	client = sqs.NewFromConfig(cfg)
}
