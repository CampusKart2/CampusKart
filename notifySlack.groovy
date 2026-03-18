def call(String status = 'INFO', String channel = '#jenkins') {
    def colorMap = [
        'STARTED' : '#FFFF00',
        'SUCCESS' : 'good',
        'FAILURE' : 'danger',
        'UNSTABLE': 'warning',
        'ABORTED' : '#808080',
        'INFO'    : '#439FE0'
    ]

    def emojiMap = [
        'STARTED' : '🚀',
        'SUCCESS' : '✅',
        'FAILURE' : '❌',
        'UNSTABLE': '⚠️',
        'ABORTED' : '🛑',
        'INFO'    : 'ℹ️'
    ]

    def branchName = env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'unknown'
    def triggerUser = currentBuild.getBuildCauses()?.collect { it.shortDescription }?.join(', ') ?: 'unknown trigger'

    def color = colorMap.get(status, '#439FE0')
    def emoji = emojiMap.get(status, 'ℹ️')

    def message = """${emoji} *${status}*
Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Branch: ${branchName}
Cause: ${triggerUser}
URL: ${env.BUILD_URL}"""

    slackSend(
        channel: channel,
        color: color,
        message: message
    )
}