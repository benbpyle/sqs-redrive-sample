package main

type Payload struct {
	QueueArn string `json:"queueArn"`
	Status   string `json:"status"`
}
