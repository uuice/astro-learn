
import packageJson from '../../package.json'
export const versionCommand = () => {
  console.log(`CLI v${packageJson.version}`)
}
