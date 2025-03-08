import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";

const API_URL = "https://64b0c83bc60b8f941af5fdab.mockapi.io/product";

export default function Home({ navigation }) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [ searchText, setSearchText ] = useState(''); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        const products = response.data;

        const uniqueBrands = [
          ...new Set(products.map((item) => item.brand)),
        ];
        setBrands(uniqueBrands);
        setData(products);
        setFilteredData(products); 
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    const unsubscribe = navigation.addListener("focus", fetchData);
    return unsubscribe;
  }, []);

  useEffect(() => {
    let results = data;

    if (selectedBrand) {
      results = results.filter((item) => item.brand === selectedBrand);
    }

    if (searchText.trim() !== "") {
      const searchLower = searchText.toLowerCase().trim();
      results = results.filter(item => 
        item.artName.toLowerCase().includes(searchLower)
      );
    }
    setFilteredData(results);
  }, [selectedBrand, searchText, data])

  const filterByBrand = (brand) => {
    if (brand === selectedBrand) {
      setSelectedBrand(null);
    } else {
      setSelectedBrand(brand);
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
    if (limitedTimeDeal && limitedTimeDeal > 0 && limitedTimeDeal < 1) {
      return Math.round(limitedTimeDeal * 100);
    }
    return 0;
  };

  const calculateDiscountedPrice = (price, discountPercent) => {
    if (discountPercent && discountPercent > 0 && discountPercent < 1) {
      return (price * (1 - discountPercent)).toFixed(2);
    }
    return price.toFixed(2);
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      
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
          const discountedPrice = calculateDiscountedPrice(item.price, item.limitedTimeDeal);
          return (
            <View style={{ flex: 1, padding: 10, maxWidth: "50%" }}>
              <View style={styles.itemContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Detail", { id: item.id })}
                >
                  <View>
                    <View style={styles.imageContainer}>
                      <Image
                        style={styles.image}
                        source={{ uri: item.image }}
                        resizeMode="contain" 
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
                  <Text numberOfLines={2}>{item.artName}</Text>
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
                    <Text style={styles.discountText}>{discountPercent}%</Text>
                    <Text style={styles.limitedTimeDeal}>{discountedPrice}$</Text>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  itemContainer: {
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    height: 270,
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
    gap: 5,
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
