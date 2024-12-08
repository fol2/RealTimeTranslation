export class AuthService {
  private static token: string = '';
  private static isVercelEnvironment: boolean | null = null;

  private static async checkVercelEnvironment(): Promise<boolean> {
    if (this.isVercelEnvironment !== null) {
      return this.isVercelEnvironment;
    }

    try {
      const response = await fetch('/.well-known/vercel-user-meta', {
        method: 'HEAD'
      });
      this.isVercelEnvironment = response.ok;
      return this.isVercelEnvironment;
    } catch (error) {
      console.warn('Not in Vercel environment:', error);
      this.isVercelEnvironment = false;
      return false;
    }
  }

  static async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    try {
      // Check if we're in a Vercel environment
      const isVercel = await this.checkVercelEnvironment();
      
      if (!isVercel) {
        // If not in Vercel, use a development token or alternative auth method
        this.token = 'development-token';
        return this.token;
      }

      // Try to get token from Vercel's meta endpoint
      const response = await fetch('/.well-known/vercel-user-meta');
      if (!response.ok) {
        throw new Error('Failed to get Vercel token');
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from Vercel');
      }

      try {
        const data = JSON.parse(text);
        if (!data.token) {
          throw new Error('No token found in response');
        }
        this.token = data.token;
        return this.token;
      } catch (parseError) {
        console.error('Failed to parse Vercel response:', text);
        throw parseError;
      }
    } catch (error) {
      console.error('Error getting Vercel token:', error);
      // Fallback to development token if all else fails
      this.token = 'development-token';
      return this.token;
    }
  }

  static clearToken() {
    this.token = '';
    this.isVercelEnvironment = null;
  }
}
