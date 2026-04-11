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
          def targetNode = 'dev'
          if (env.BRANCH_NAME == 'QA') {
            targetNode = 'qa'
          } else if (env.BRANCH_NAME == 'main') {
            targetNode = 'dev'
          }

          node(targetNode) {
            withEnv([
              "DEPLOY_DIR=${env.HOME}/CampusKart",
              "APP_DIR=${env.HOME}/CampusKart/Frontend",
              "CONTAINER_NAME=campuskart-container",
              "PORT=3000",
              "COMPOSE_FILE=${env.HOME}/CampusKart/Frontend/docker-compose.yml",
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

              stage('Stop Host Process on 3000') {
                sh '''
                  fuser -k "$PORT"/tcp || true
                '''
              }

              stage('Clean Docker Cache') {
                sh '''
                  docker system df || true
                  docker builder prune -af || true
                  docker image prune -af || true
                  docker system df || true
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

                  docker compose -f "$COMPOSE_FILE" down || true
                  docker compose -f "$COMPOSE_FILE" build --no-cache
                  docker compose -f "$COMPOSE_FILE" up -d
                '''
              }

              stage('Wait for App') {
                sh 'sleep 15'
              }

              stage('Smoke (testRigor)') {
                if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'QA') {
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
        }
      }
    }
  }

  post {
    always {
      script {
        def targetNode = 'dev'
        if (env.BRANCH_NAME == 'QA') {
          targetNode = 'qa'
        } else if (env.BRANCH_NAME == 'main') {
          targetNode = 'dev'
        }

        node(targetNode) {
          notifySlack(currentBuild.currentResult, '#jenkins')
        }
      }
    }
  }
}
