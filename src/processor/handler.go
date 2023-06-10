package main

import (
	"context"
	"errors"
	"os"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"

	log "github.com/sirupsen/logrus"
)

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

func main() {
	lambda.Start(handler)
}

func init() {
	isLocal, _ := strconv.ParseBool(os.Getenv("IS_LOCAL"))

	log.SetFormatter(&log.JSONFormatter{
		PrettyPrint: isLocal,
	})

}
