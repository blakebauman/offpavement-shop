export const KIT_SLOTS: Record<
  string,
  { required: string[]; optional: string[] }
> = {
  frame_bag: {
    required: ["overnight", "weekend", "multi_day", "expedition"],
    optional: [],
  },
  seat_bag: {
    required: ["overnight", "weekend", "multi_day", "expedition"],
    optional: [],
  },
  handlebar_bag: {
    required: ["multi_day", "expedition"],
    optional: ["weekend"],
  },
  top_tube_bag: {
    required: [],
    optional: ["overnight", "weekend", "multi_day", "expedition"],
  },
  feed_bag: {
    required: [],
    optional: ["all"],
  },
  shelter: {
    required: ["overnight", "weekend", "multi_day", "expedition"],
    optional: [],
  },
  sleeping_bag: {
    required: ["overnight", "weekend", "multi_day", "expedition"],
    optional: [],
  },
  sleeping_pad: {
    required: ["overnight", "weekend", "multi_day", "expedition"],
    optional: [],
  },
  stove: {
    required: ["multi_day", "expedition"],
    optional: ["weekend"],
  },
  cook_pot: {
    required: ["multi_day", "expedition"],
    optional: ["weekend"],
  },
  gps_device: {
    required: [],
    optional: ["all"],
  },
  tool_kit: {
    required: ["all"],
    optional: [],
  },
  first_aid: {
    required: ["multi_day", "expedition"],
    optional: ["weekend"],
  },
}
