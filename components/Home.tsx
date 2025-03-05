import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";

const API_URL = "https://64b0c83bc60b8f941af5fdab.mockapi.io/product";

export default function Home({ navigation }) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        const products = response.data;

        // Lấy danh sách thương hiệu duy nhất
        const uniqueBrands = [
          ...new Set(products.map((item) => item.brand)),
        ];
        setBrands(uniqueBrands);
        setData(products);
        setFilteredData(products); // Mặc định hiển thị tất cả sản phẩm
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    const unsubscribe = navigation.addListener("focus", fetchData);
    return unsubscribe;
  }, []);

  const filterByBrand = (brand) => {
    if (brand === selectedBrand) {
      setSelectedBrand(null);
      setFilteredData(data); // Hiển thị lại tất cả sản phẩm nếu nhấn lại thương hiệu đã chọn
    } else {
      setSelectedBrand(brand);
      setFilteredData(data.filter((item) => item.brand === brand));
    }
  };

  const toggleFavorite = async (
    id,
    currentStatus,
    image,
    artName,
    price,
    limitedTimeDeal
  ) => {
    try {
      const newStatus = !currentStatus;
      await axios.put(`${API_URL}/${id}`, { status: newStatus });

      if (newStatus) {
        await AsyncStorage.setItem(
          `product_$${id}`,
          JSON.stringify({
            id,
            status: newStatus,
            image,
            artName,
            price,
            limitedTimeDeal,
          })
        );
      } else {
        await AsyncStorage.removeItem(`product_$${id}`);
      }

      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
      setFilteredData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error("Error toggling favorite status:", error);
    }
  };

  const calculateDiscountPercent = (price, limitedTimeDeal) => {
    if (limitedTimeDeal && limitedTimeDeal < price) {
      return Math.round(((price - limitedTimeDeal) / price) * 100);
    }
    return 0;
  };

  return (
    <View style={styles.container}>
      {/* Danh sách các thương hiệu */}
      <View style={styles.brandContainer}>
        <FlatList
          horizontal
          data={brands}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.brandButton,
                selectedBrand === item && styles.brandButtonSelected,
              ]}
              onPress={() => filterByBrand(item)}
            >
              <Text
                style={[
                  styles.brandText,
                  selectedBrand === item && styles.brandTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Danh sách sản phẩm */}
      <FlatList
        data={filteredData}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const discountPercent = calculateDiscountPercent(
            item.price,
            item.limitedTimeDeal
          );
          const hasDiscount = discountPercent > 0;
          return (
            <View style={{ flex: 1, padding: 8, maxWidth: "50%" }}>
              <View style={styles.itemContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Detail", { id: item.id })}
                >
                  <View>
                    <View style={styles.imageContainer}>
                      <Image
                        style={styles.image}
                        source={{ uri: item.image }}
                      />
                    </View>
                    <View style={styles.favoriteContainer}>
                      <TouchableOpacity
                        onPress={() =>
                          toggleFavorite(
                            item.id,
                            item.status,
                            item.image,
                            item.artName,
                            item.price,
                            item.limitedTimeDeal
                          )
                        }
                      >
                        <Icon
                          name={item.status ? "favorite" : "favorite-outline"}
                          size={30}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.productNameContainer}>
                  <Text>{item.artName}</Text>
                </View>
                <Text
                  style={[
                    styles.price,
                    hasDiscount && styles.priceStrikethrough,
                  ]}
                >
                  {item.price}$
                </Text>
                {hasDiscount && (
                  <View style={styles.discountContainer}>
                    <Text style={styles.limitedTimeDeal}>
                      {item.limitedTimeDeal}$
                    </Text>
                    <Text style={styles.discountText}>{discountPercent}%</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  brandContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  brandButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#EAEAEA",
    marginRight: 10,
  },
  brandButtonSelected: {
    backgroundColor: "#416D19",
  },
  brandText: {
    fontSize: 16,
    color: "#000",
  },
  brandTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  itemContainer: {
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 10,
  },
  imageContainer: {
    width: 150,
    height: 150,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  favoriteContainer: {
    position: "absolute",
    top: -15,
    right: -5,
    padding: 5,
    borderRadius: 15,
  },
  productNameContainer: {
    width: "auto",
    marginVertical: 10,
  },
  price: {
    fontSize: 16,
    color: "black",
  },
  priceStrikethrough: {
    textDecorationLine: "line-through",
    color: "gray",
  },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  limitedTimeDeal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
  },
  discountText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "green",
  },
});
