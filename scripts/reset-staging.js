'use strict'

const { promisify } = require('util')
const execute = promisify(require('child_process').exec)
const replace = require('replace-in-file')
const fs = require('fs')

process.env.CURRENT_STAGING = 'staging-35test'
const MAIN_BRANCH = 'aymeric/implement-staging-reset-job'
const CURRENT_STAGING_NUMBER = process.env.CURRENT_STAGING.replace(/^staging-/, '')
const NEW_STAGING_NUMBER = getWeekNumber().toString().padStart(2, '0')
const CURRENT_STAGING_BRANCH = `staging-${CURRENT_STAGING_NUMBER}`
const NEW_STAGING_BRANCH = `staging-${NEW_STAGING_NUMBER}`

const CI_FILE = '.gitlab-ci.yml'

async function main() {
  // git config user.email "jenkins@datadoghq.com"
  // git config user.name "Jenkins staging reset job"
  // git config push.default simple
  const GITHUB_DEPLOY_KEY = await getSecretKey('ci.browser-sdk.github_deploy_key')

  await executeCommand(`command -v ssh-agent >/dev/null || ( apt-get update -y && apt-get install openssh-client -y )`)

  await executeCommand(`ssh-agent -s`)

  await executeCommand(`ssh-add - <<< "${GITHUB_DEPLOY_KEY}"`)

  // echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -

  console.log('KEY:', GITHUB_DEPLOY_KEY)

  // await executeCommand(`git config user.name "Gitlab staging reset job"`)

  // await executeCommand(`git checkout ${MAIN_BRANCH}`)

  // console.log(`Changing staging branch in ${CI_FILE}...`)
  // await replace({
  //   files: CI_FILE,
  //   from: /CURRENT_STAGING: staging-.*/g,
  //   to: `CURRENT_STAGING: ${NEW_STAGING_BRANCH}`,
  // })

  // await executeCommand(`git commit ${CI_FILE} -m "Change staging branch in ${CI_FILE} to ${NEW_STAGING_BRANCH}" ${CI_FILE}`)
  // await executeCommand(`git push origin ${MAIN_BRANCH}`)

  // console.log(`Creating the new staging branch...`)
  // await executeCommand(`git checkout -b ${NEW_STAGING_BRANCH}`)
  // await executeCommand(`git push origin ${NEW_STAGING_BRANCH}`)

  // console.log(`Disabling CI on the old branch...`)
  // await executeCommand(`git checkout staging-${OLD_BRANCH_NUMBER}`)
  // await executeCommand(`git rm ${CI_FILE}`)
  // await executeCommand(`git commit ${CI_FILE} -m "Remove ${CI_FILE} on old branch so pushes are noop"`)
  // await executeCommand(`git push origin staging-${OLD_BRANCH_NUMBER}`)

  // console.log('Reset Done.')
  // const message = `✅ [*browser-sdk*] Staging has been reset from *staging-${CURRENT_STAGING_NUMBER}* to *${NEW_STAGING_BRANCH}*.`
  // await sendMessage('#staging-headsup', message, 'success')
  // console.log('Slack pinged.')
}

async function sendError(e) {
  const message = `❌ [*browser-sdk*] Staging failed to reset from *${CURRENT_STAGING_BRANCH}* to *${NEW_STAGING_BRANCH}*.

An error occurred: *${e.toString()}*.
`
  await sendMessage('#staging-headsup', message, 'alert')
}

function getSecretKey(name) {
  const awsParameters = [
    'ssm',
    'get-parameter',
    `--region=us-east-1`,
    '--with-decryption',
    '--query=Parameter.Value',
    '--out=text',
    `--name=${name}`,
  ]

  return executeCommand(`aws ${awsParameters.join(' ')}`)
}

function getWeekNumber(today = new Date()) {
  const jan1 = new Date(today.getUTCFullYear(), 0, 1)
  return Math.ceil(((today - jan1) / 86400000 + jan1.getUTCDay() + 1) / 7)
}

const sendMessage = (channel, message, state) => {
  if (!channel || !message) {
    throw new Error('Missing params.')
  }

  return executeCommand(`postmessage "${channel}" "${message}"${state ? ` "${state}"` : ''}`)
}

async function executeCommand(command) {
  const commandResult = await execute(command, { shell: '/bin/bash' })
  if (commandResult.stderr) {
    throw commandResult.stderr
  }
  return commandResult.stdout
}

main().catch((e) => {
  console.error(e)
  // sendError(e)
})
