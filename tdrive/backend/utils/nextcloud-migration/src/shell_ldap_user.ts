import { LdapConfiguration } from './ldap_user';
import { exec } from 'child_process';
import ldif from 'ldif';
import { logger } from "./logger"
import { User, UserProvider } from "./user_privider";

export class ShellLdapUserProvider implements UserProvider {

  private config: LdapConfiguration;

  constructor(config: LdapConfiguration) {
    this.config = config;
  }

  async find(username: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      let cmd = `ldapsearch -x -H ${this.config.url} -b '${this.config.baseDn}' '(uid=${username})'`;
      logger.info("Executing command to get data from LDAP for " + username);
      exec(cmd, (error, stdout, stderr) => {
        if (stderr) {
          logger.info("ERROR: " + stderr);
        }
        if (error) {
          logger.info(`ERROR running sync for the user: ${error.message}`);
          reject(new Error(error.message));
        } else {
          if (stdout) {
            try {
              if (stdout.lastIndexOf("# search result") > 0) {
                stdout = stdout.substring(0, stdout.lastIndexOf("# search result"))
              }
              let obj =  ldif.parse(stdout).shift().toObject({});
              resolve({
                lastName: obj.attributes.sn,
                firstName: obj.attributes.givenName,
                email: obj.attributes.mail,
                uid: obj.attributes.uid} as User);
            } catch (e) {
              console.error(e)
              resolve({ } as User);
            }
          } else {
            logger.info("No user");
            resolve({ } as User);
          }
        }
      });
    });
  }

}