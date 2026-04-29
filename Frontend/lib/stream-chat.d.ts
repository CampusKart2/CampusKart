import "stream-chat";

declare module "stream-chat" {
  /**
   * Custom channel fields stored on Stream channels we create.
   *
   * This is used for strict typing throughout the app via Stream's generics.
   */
  interface CustomChannelData {
    listingId: string;
    buyerId: string;
    sellerId: string;
    listingTitle?: string;
  }
}

