@Library('my-shared-lib') _

pipeline {
  agent none

  options {
    skipDefaultCheckout(true)
  }

  triggers {
    githubPush()
  }

  stages {
    stage('Run Pipeline') {
      steps {
        script {
          def targetNode = ''
          def deployDir = ''
          def trAppId = ''
          def trToken = ''
          def envName = ''

          if (env.BRANCH_NAME == 'QA') {
            targetNode = 'QA'
            deployDir = '/home/jenkins/CampusKart'
            trAppId = 'Dco3jJ2ejL9PweWr2'
            trToken = '8ebc4045-b5e1-4191-9b7c-cc075ac8bfbb'
            envName = 'QA'
          } else if (env.BRANCH_NAME == 'main') {
            targetNode = 'dev'
            deployDir = '/home/jenkins/CampusKart'
            trAppId = 'MHSYf9zssrMoippDT'
            trToken = '2faab20a-9466-466b-8d0d-99c97338bfbc'
            envName = 'DEV'
          } else {
            error("Unsupported branch for deployment: ${env.BRANCH_NAME}")
          }

          node(targetNode) {
            withEnv([
              "DEPLOY_DIR=${deployDir}",
              "APP_DIR=${deployDir}/Frontend",
              "CONTAINER_NAME=campuskart-container",
              "PORT=3000",
              "COMPOSE_FILE=${deployDir}/Frontend/docker-compose.yml"
            ]) {

              stage('Checkout') {
                checkout scm
              }

              stage('Notify Start') {
                notifySlack('STARTED', '#jenkins')
              }

              stage('Copy Files to Deploy Folder') {
                sh '''
                  mkdir -p "$APP_DIR"

                  rsync -av --delete \
                    --exclude='.git' \
                    --exclude='.env.local' \
                    --exclude='node_modules' \
                    --exclude='.next' \
                    ./Frontend/ "$APP_DIR/"
                '''
              }

              stage('Debug Docker Access') {
                sh '''
                  echo "NODE NAME:"
                  echo "$NODE_NAME"

                  echo "USER:"
                  whoami

                  echo "ID:"
                  id

                  echo "GROUPS:"
                  groups

                  echo "HOME:"
                  echo "$HOME"

                  echo "APP_DIR:"
                  echo "$APP_DIR"

                  echo "DOCKER SOCK:"
                  ls -l /var/run/docker.sock || true

                  echo "DOCKER PATH:"
                  which docker || true

                  echo "DOCKER VERSION:"
                  docker version || true

                  echo "DOCKER PS:"
                  docker ps || true

                  echo "DOCKER COMPOSE VERSION:"
                  docker compose version || true

                  echo "ENV FILE:"
                  ls -la "$APP_DIR/.env.local" || true
                '''
              }

              stage('Stop Host Process on 3000') {
                sh '''
                  fuser -k "$PORT"/tcp || true
                '''
              }

              stage('Clean Docker Cache') {
                sh '''
                  sudo docker system df || true
                  sudo docker builder prune -af || true
                  sudo docker image prune -af || true
                  sudo docker system df || true
                '''
              }

              stage('Deploy with Docker Compose') {
                sh '''
                  set -e

                  cd "$APP_DIR"

                  if [ ! -f "$COMPOSE_FILE" ]; then
                    echo "docker-compose file not found at $COMPOSE_FILE"
                    ls -la "$APP_DIR"
                    exit 1
                  fi

                  sudo docker compose -f "$COMPOSE_FILE" down || true
                  sudo docker compose -f "$COMPOSE_FILE" build --no-cache
                  sudo docker compose -f "$COMPOSE_FILE" up -d
                '''
              }

              stage('Wait for App') {
                sh 'sleep 15'
              }

              stage('Smoke (testRigor)') {
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
      }
    }
  }

  post {
    always {
      script {
        def targetNode = ''

        if (env.BRANCH_NAME == 'QA') {
          targetNode = 'QA'
        } else if (env.BRANCH_NAME == 'main') {
          targetNode = 'dev'
        } else {
          targetNode = 'dev'
        }

        node(targetNode) {
          notifySlack(currentBuild.currentResult, '#jenkins')
        }
      }
    }
  }
}