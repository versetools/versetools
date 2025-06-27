#!/bin/bash

PROFILE=( $(cat .aws_profile) )
aws codeartifact --region eu-central-1 --profile $PROFILE login --tool npm --repository versetools --domain packages --namespace @versetools
aws codeartifact --region eu-central-1 --profile $PROFILE login --tool npm --repository l3dev-private --domain packages --namespace @l3dev-private