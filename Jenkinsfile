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
    DEPLOY_DIR = "${env.HOME}/CampusKart"
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

    stage('Copy Files to Deploy Folder') {
      steps {
        sh '''
          mkdir -p "$DEPLOY_DIR/Frontend"
          rsync -av --delete \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.next' \
            ./ "$DEPLOY_DIR/"
        '''
      }
    }

    stage('Stop Host Process on 3000') {
      steps {
        sh '''
          fuser -k 3000/tcp || true
        '''
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

    stage('Build Docker Image') {
      steps {
        sh '''
          docker build -t $APP_NAME -f "$DEPLOY_DIR/Frontend/Dockerfile" "$DEPLOY_DIR/Frontend"
        '''
      }
    }

    stage('Run New Container') {
  steps {
    sh '''
      docker rm -f $CONTAINER_NAME || true

      docker run -d \
        --restart unless-stopped \
        --name $CONTAINER_NAME \
        -p $PORT:$PORT \
        --env-file "$DEPLOY_DIR/Frontend/.env.local" \
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
      when {
        expression { env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'QA' }
      }
      steps {
        script {
          def trAppId = ''
          def trToken = ''
          def envName = ''

          if (env.BRANCH_NAME == 'main') {
            trAppId = 'MHSYf9zssrMoippDT'
            trToken = '2faab20a-9466-466b-8d0d-99c97338bfbc'
            envName = 'DEV'
          } else if (env.BRANCH_NAME == 'QA') {
            trAppId = 'Dco3jJ2ejL9PweWr2'
            trToken = '8ebc4045-b5e1-4191-9b7c-cc075ac8bfbb'
            envName = 'QA'
          } else {
            error("No testRigor mapping found for branch: ${env.BRANCH_NAME}")
          }

          echo "Running testRigor smoke tests for ${envName}"

          sh """
            curl -X POST \
              -H 'Content-type: application/json' \
              -H 'auth-token: ${trToken}' \
              --data '{"forceCancelPreviousTesting":true,"storedValues":{"storedValueName1":"Value"}}' \
              https://api.testrigor.com/api/v1/apps/${trAppId}/retest

            sleep 10

            while true
            do
              echo " "
              echo "==================================="
              echo " Checking run status for ${envName}"
              echo "==================================="
              response=\$(curl -i -o - -s -X GET 'https://api.testrigor.com/api/v1/apps/${trAppId}/status' \
                -H 'auth-token: ${trToken}' \
                -H 'Accept: application/json')

              code=\$(echo "\$response" | grep HTTP | awk '{print \$2}')
              body=\$(echo "\$response" | sed -n '/{/,/}/p')

              echo "Status code: \$code"
              echo "Response: \$body"

              case \$code in
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
          """
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