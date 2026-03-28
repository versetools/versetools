script_dir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
profile_file="$script_dir/.aws_profile"

PROFILE=( $(cat $profile_file) )
aws codeartifact --region eu-central-1 --profile $PROFILE login --tool npm --repository versetools --domain packages --namespace @versetools
aws codeartifact --region eu-central-1 --profile $PROFILE login --tool npm --repository l3dev-private --domain packages --namespace @l3dev-private
