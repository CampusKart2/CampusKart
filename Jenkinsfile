@Library('my-shared-lib') _

pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
  }

  triggers {
    githubPush()
  }

  environment {
    APP_NAME = 'campuskart-app'
    CONTAINER_NAME = 'campuskart-container'
    PORT = '3000'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Notify Start') {
      steps {
        script {
          notifySlack('STARTED', '#jenkins')
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        dir('Frontend') {
          sh 'docker build -t $APP_NAME .'
        }
      }
    }

    stage('Stop Old Container') {
      steps {
        sh '''
          docker stop $CONTAINER_NAME || true
          docker rm $CONTAINER_NAME || true
        '''
      }
    }

    stage('Run New Container') {
      steps {
        sh '''
          docker run -d \
            --restart unless-stopped \
            --name $CONTAINER_NAME \
            -p $PORT:$PORT \
            $APP_NAME
        '''
      }
    }

    stage('Wait for App') {
      steps {
        sh 'sleep 15'
      }
    }

    stage('Smoke (testRigor)') {
      steps {
        withCredentials([string(credentialsId: 'TESTRIGOR_TOKEN', variable: 'TR_TOKEN')]) {
          sh '''
            curl -X POST \
              -H "Content-type: application/json" \
              -H "auth-token: $TR_TOKEN" \
              --data '{"forceCancelPreviousTesting":true,"storedValues":{"storedValueName1":"Value"}}' \
              https://api.testrigor.com/api/v1/apps/MHSYf9zssrMoippDT/retest

            sleep 10

            while true
            do
              echo " "
              echo "==================================="
              echo " Checking run status"
              echo "==================================="
              response=$(curl -i -o - -s -X GET 'https://api.testrigor.com/api/v1/apps/MHSYf9zssrMoippDT/status' -H "auth-token: $TR_TOKEN" -H 'Accept: application/json')
              code=$(echo "$response" | grep HTTP | awk '{print $2}')
              body=$(echo "$response" | sed -n '/{/,/}/p')
              echo "Status code: $code"
              echo "Response: $body"

              case $code in
                4*|5*)
                  echo "Error calling API"
                  exit 1
                  ;;
                200)
                  echo "Test finished successfully"
                  exit 0
                  ;;
                227|228)
                  echo "Test is not finished yet"
                  ;;
                229)
                  echo "Test canceled"
                  exit 1
                  ;;
                230)
                  echo "Test finished but failed"
                  exit 1
                  ;;
                *)
                  echo "Unknown status"
                  exit 1
                  ;;
              esac

              sleep 10
            done
          '''
        }
      }
    }
  }

  post {
    always {
      script {
        notifySlack(currentBuild.currentResult, '#jenkins')
      }
    }
  }
}