import { Fungies } from "@fungies/fungies-js"

export const initFungies = () => {
  if (typeof window !== "undefined") {
    Fungies.Initialize({
      enableDataAttributes: true
    })
    return Fungies
  }
  return null
}

export const getFungies = () => {
  if (typeof window !== "undefined") {
    return Fungies
  }
  return null
}
