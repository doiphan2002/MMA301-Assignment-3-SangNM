import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Button,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";

const API_URL = "https://64b0c83bc60b8f941af5fdab.mockapi.io/product";

export default function Favourite() {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);

  const loadProductsFromStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const products = await AsyncStorage.multiGet(keys);
      const filteredProducts = products
        .filter(([key, value]) => key.startsWith("product_"))
        .map(([key, value]) => JSON.parse(value));
      setProducts(filteredProducts);
    } catch (error) {
      console.error("Error loading products from AsyncStorage:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      await loadProductsFromStorage();
      const { data } = await axios.get(API_URL);
      setProducts(data.filter((product) => product.status === true));
    });

    return unsubscribe;
  }, [navigation]);

  const removeProduct = async (id) => {
    try {
      await AsyncStorage.removeItem(`product_${id}`);
      setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
      await updateProductStatus(id, false);
    } catch (error) {
      console.error('Error removing product from AsyncStorage:', error);
    }
  };
  

  const clearAllProducts = async () => {
    try {
      await AsyncStorage.multiRemove(products.map(product => `product_${product.id}`));
      setProducts([]);
      await Promise.all(products.map(product => updateProductStatus(product.id, false)));
    } catch (error) {
      console.error('Error clearing all products from AsyncStorage:', error);
    }
  };

  const updateProductStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/${id}`, { status });
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const calculateDiscountPercent = (price, limitedTimeDeal) => {
    if (limitedTimeDeal && limitedTimeDeal < price) {
      return Math.round(((price - limitedTimeDeal) / price) * 100);
    }
    return 0;
  };

  const renderProductItem = ({ item }) => {
    const discountPercent = calculateDiscountPercent(
      item.price,
      item.limitedTimeDeal
    );
    const hasDiscount = discountPercent > 0;

    return (
      <View style={{ flex: 1, padding: 8, maxWidth: "50%" }}>
        <View style={styles.itemContainer}>
          <View>
            <View style={styles.imageContainer}>
              <Image style={styles.image} source={{ uri: item.image }} />
            </View>
            <View style={styles.favoriteContainer}>
              <TouchableOpacity onPress={() => removeProduct(item.id)}>
                <Icon
                  name={item.status ? "favorite" : "favorite-outline"}
                  size={30}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.productNameContainer}>
            <Text>{item.artName}</Text>
          </View>
          <Text
            style={[styles.price, hasDiscount && styles.priceStrikethrough]}
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
  };

  return (
    <View style={styles.container}>
      <FlatList data={products} numColumns={2} renderItem={renderProductItem} />
      <Button title="Clear All" onPress={clearAllProducts} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  itemContainer: {
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 10,
  },
  productNameContainer: {
    width: "auto",
    marginVertical: 10,
  },
  imageContainer: {
    position: "relative",
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
  price: { fontSize: 16, color: "black", marginTop: 4 },
  priceStrikethrough: { textDecorationLine: "line-through", color: "gray" },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  limitedTimeDeal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
    marginRight: 5,
  },
  discountText: { fontSize: 14, fontWeight: "bold", color: "green" },
});
