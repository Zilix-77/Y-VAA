const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Builds a random 6-character room code (easy to read aloud, no 0/O/1/I).
 */
export function generateRoomCode() {
  let code = '';
  for (let index = 0; index < 6; index += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET.charAt(randomIndex);
  }
  return code;
}
