function topRestaurantsQuery (id, limit, sql) {
  if (sql === 'PostgreSQL') {
    return `SELECT "Restaurant"."id", "Restaurant"."name",
        MAX(CASE "FavoritedUsers"."id"- ${id} WHEN 0 THEN 1 ELSE 0 END) AS "isFavorited",
        COUNT("FavoritedUsers"."id") AS "favoritedCount",
        "Restaurant"."image","Restaurant"."description"
        FROM "Restaurants" AS "Restaurant"
        LEFT OUTER JOIN ( "Favorites" AS "FavoritedUsers->Favorite"
        INNER JOIN "Users" AS "FavoritedUsers"
        ON "FavoritedUsers"."id" = "FavoritedUsers->Favorite"."user_id")
        ON "Restaurant"."id" = "FavoritedUsers->Favorite"."restaurant_id"
        GROUP BY "Restaurant"."id"
        ORDER BY "favoritedCount" DESC LIMIT ${limit};`
  } else if (sql === 'MySQL') {
    return 'SELECT `Restaurant`.`id`, `Restaurant`.`name`,' +
        ' MAX(CASE `FavoritedUsers`.`id`- ' +
        id +
        ' WHEN 0 THEN 1 ELSE 0 END) AS `isFavorited`,' +
        ' COUNT(`FavoritedUsers`.`id`) AS `favoritedCount`,' +
        ' `Restaurant`.`image`,`Restaurant`.`description`' +
        ' FROM `Restaurants` AS `Restaurant`' +
        ' LEFT OUTER JOIN ( `Favorites` AS `FavoritedUsers->Favorite`' +
        ' INNER JOIN `Users` AS `FavoritedUsers`' +
        ' ON `FavoritedUsers`.`id` = `FavoritedUsers->Favorite`.`user_id`)' +
        ' ON `Restaurant`.`id` = `FavoritedUsers->Favorite`.`restaurant_id`' +
        ' GROUP BY `Restaurant`.`id`' +
        ' ORDER BY `favoritedCount` DESC LIMIT ' +
        limit +
        ' ;'
  }
  return 'wrong SQL'
}

//
module.exports = {
  topRestaurantsQuery
}
